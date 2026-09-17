<?php

namespace App\Http\Controllers;

use App\Models\Position;
use App\Models\Skill;
use App\Models\Studio;
use App\Models\Tenant\ChannelMessage;
use App\Models\Tenant\ChannelRead;
use App\Models\Tenant\Project;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use App\Models\Tenant\TaskEstimateSubmission;
use App\Models\Tenant\TeamVelocity;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TenantDashboardController extends Controller
{
    /**
     * Show the Tenant (Studio) Dashboard.
     *
     * Managers see the AI-powered manager dashboard.
     * Members see a Linear-style "My Work" member dashboard.
     */
    public function index()
    {
        $studio = Studio::find(tenant('id'));
        $user = auth()->user();

        if (request()->query('view') === 'inbox') {
            $studioId = $studio ? $studio->id : tenant('id');

            return redirect()->to("/studio/{$studioId}/inbox");
        }

        $isManager = $this->resolveIsManager($user, tenant('id'));

        if (! $isManager) {
            return $this->memberDashboard($studio, $user);
        }

        return $this->managerDashboard($studio);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function resolveIsManager(?object $user, ?string $studioId): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        $member = DB::connection(config('tenancy.database.central_connection', 'central'))
            ->table('studio_members')
            ->where('studio_id', $studioId)
            ->where('user_id', $user->id)
            ->first();

        $role = $member ? $member->role : 'member';

        return in_array($role, ['owner', 'leader', 'manager']);
    }

    private function memberDashboard(mixed $studio, mixed $user): Response
    {
        $myTasks = [];
        $activeSprint = null;
        $sprintTasks = [];
        $inboxTasks = [];

        try {
            $assignedTasks = Task::with([
                'project:id,name,status',
                'sprint:id,name,status,start_date,end_date',
                'epic:id,name,color',
                'assignee',
                'reviewer',
            ])
                ->where(function ($q) use ($user) {
                    $q->where('assigned_user_id', $user->id)
                        ->orWhere('reviewer_user_id', $user->id);
                })
                ->get();

            $activeSprintId = null;

            if (Schema::hasTable('sprints')) {
                $activeSprintRecord = Sprint::where('status', 'active')
                    ->whereHas('tasks', fn ($q) => $q->where('assigned_user_id', $user->id)->orWhere('reviewer_user_id', $user->id))
                    ->with('project:id,name')
                    ->latest()
                    ->first();

                if ($activeSprintRecord) {
                    $activeSprintId = $activeSprintRecord->id;
                    $totalSprintTasks = Task::where('sprint_id', $activeSprintId)->count();
                    $doneSprintTasks = Task::where('sprint_id', $activeSprintId)->where('sprint_status', 'done')->count();

                    $activeSprint = [
                        'id' => $activeSprintRecord->id,
                        'name' => $activeSprintRecord->name,
                        'status' => $activeSprintRecord->status,
                        'start_date' => $activeSprintRecord->start_date?->format('Y-m-d'),
                        'end_date' => $activeSprintRecord->end_date?->format('Y-m-d'),
                        'project_name' => $activeSprintRecord->project?->name ?? '',
                        'total_tasks' => $totalSprintTasks,
                        'done_tasks' => $doneSprintTasks,
                        'completion' => $totalSprintTasks > 0
                            ? round(($doneSprintTasks / $totalSprintTasks) * 100)
                            : 0,
                    ];
                }
            }

            $myTasks = $assignedTasks->map(fn (Task $task) => $this->formatTaskForMember($task, $user))->values()->all();

            $sprintTasks = $activeSprintId
                ? $assignedTasks
                    ->where('sprint_id', $activeSprintId)
                    ->map(fn (Task $task) => $this->formatTaskForMember($task, $user))
                    ->values()
                    ->all()
                : [];

            // Inbox contains:
            // 1) Tasks assigned to this user that are in review and waiting for this user to review
            // 2) Newly assigned tasks to this user that haven't been started yet
            $inboxTasks = collect($myTasks)
                ->filter(function ($t) {
                    $isPendingReviewForMe = ! empty($t['is_reviewer']) && in_array($t['sprint_status'] ?? $t['status'] ?? '', ['waiting_for_review', 'review']);
                    $isUnstartedForMe = ! empty($t['is_doer']) && (in_array($t['sprint_status'] ?? '', ['ready_to_start', '']) || ($t['sprint_status'] === null && $t['status'] === 'todo'));

                    return $isPendingReviewForMe || $isUnstartedForMe;
                })
                ->take(20)
                ->values()
                ->all();

            // Build structured notification feed for the Inbox view
            $notifications = collect($myTasks)->map(function ($t) {
                $type = null;
                $title = null;
                $body = null;
                $icon = null;
                $color = null;
                $link = null;

                $isReviewForMe = ! empty($t['is_reviewer']) && in_array($t['sprint_status'] ?? $t['status'] ?? '', ['waiting_for_review', 'review']);
                $isNewAssignment = ! empty($t['is_doer']) && (in_array($t['sprint_status'] ?? '', ['ready_to_start', '']) || ($t['sprint_status'] === null && $t['status'] === 'todo'));
                $isOverdue = isset($t['days_until_deadline']) && $t['days_until_deadline'] !== null && $t['days_until_deadline'] < 0;
                $isStuck = ($t['sprint_status'] ?? $t['status'] ?? '') === 'stuck';
                $sentBackToDoer = ! empty($t['is_doer']) && ($t['sprint_status'] ?? $t['status'] ?? '') === 'in_progress' && ($t['actual_story_points'] ?? null) === null;

                if ($isReviewForMe) {
                    $type = 'review_request';
                    $title = 'Review Requested';
                    $body = "{$t['assignee']} submitted \"".$t['title'].'\" for your review.';
                    $icon = 'eye';
                    $color = 'blue';
                } elseif ($isNewAssignment) {
                    $type = 'task_assigned';
                    $title = 'New Task Assigned';
                    $body = 'You have been assigned \"'.$t['title'].'\"'.(! empty($t['project_name']) ? ' in '.$t['project_name'] : '').'. Ready to start!';
                    $icon = 'clipboard';
                    $color = 'indigo';
                } elseif ($isOverdue) {
                    $type = 'overdue';
                    $title = 'Task Overdue';
                    $body = '\"'.$t['title'].'\" was due '.abs($t['days_until_deadline']).' day(s) ago. Update the status or flag as stuck.';
                    $icon = 'alert';
                    $color = 'rose';
                } elseif ($isStuck) {
                    $type = 'stuck';
                    $title = 'Task Blocked';
                    $body = '\"'.$t['title'].'\" is currently marked as stuck. Notify your team lead to unblock.';
                    $icon = 'ban';
                    $color = 'rose';
                }

                if (! $type) {
                    return null;
                }

                return [
                    'id' => 'task-'.$t['id'].'-'.$type,
                    'type' => $type,
                    'title' => $title,
                    'body' => $body,
                    'icon' => $icon,
                    'color' => $color,
                    'task_id' => $t['id'],
                    'task_title' => $t['title'],
                    'project_name' => $t['project_name'] ?? null,
                    'epic_name' => $t['epic_name'] ?? null,
                    'epic_color' => $t['epic_color'] ?? null,
                    'priority' => $t['priority'] ?? null,
                    'days_until_deadline' => $t['days_until_deadline'] ?? null,
                    'link' => null,
                    'read' => false,
                    'created_at_human' => 'Just now',
                ];
            })->filter()->values()->all();

        } catch (\Exception $e) {
            $notifications = [];
        }

        $pendingEstimatesCount = 0;
        try {
            $pendingEstimatesCount = Task::where('story_points_locked', false)
                ->where('needs_estimate_review', false)
                ->get()
                ->filter(fn ($task) => empty($task->expected_estimators)
                    ? $task->assigned_user_id === $user->id
                    : in_array($user->id, $task->expected_estimators ?? [])
                )
                ->filter(fn ($task) => ! TaskEstimateSubmission::where('task_id', $task->id)
                    ->where('developer_id', $user->id)
                    ->exists()
                )
                ->count();
        } catch (\Exception $e) {
        }

        // Estimate notifications
        if ($pendingEstimatesCount > 0) {
            $notifications[] = [
                'id' => 'estimates-pending',
                'type' => 'estimate_pending',
                'title' => 'Estimation Vote Needed',
                'body' => "You have {$pendingEstimatesCount} task(s) waiting for your Fibonacci story point vote. Your input is needed to unlock sprint planning.",
                'icon' => 'sparkles',
                'color' => 'amber',
                'task_id' => null,
                'task_title' => null,
                'project_name' => null,
                'epic_name' => null,
                'epic_color' => null,
                'priority' => null,
                'days_until_deadline' => null,
                'link' => null,
                'read' => false,
                'created_at_human' => 'Pending',
            ];
        }

        $notifications = array_merge($notifications, $this->getMessageNotifications($user));

        return Inertia::render('Tenant/MemberDashboard', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'myTasks' => $myTasks,
            'sprintTasks' => $sprintTasks,
            'inboxTasks' => $inboxTasks,
            'notifications' => $notifications,
            'activeSprint' => $activeSprint,
            'pendingEstimatesCount' => $pendingEstimatesCount,
        ]);
    }

    public function inbox(): Response
    {
        $studio = Studio::find(tenant('id'));
        $user = auth()->user();

        $myTasks = [];
        $notifications = [];

        try {
            $assignedTasks = Task::with([
                'project:id,name,status',
                'sprint:id,name,status,start_date,end_date',
                'epic:id,name,color',
                'assignee',
                'reviewer',
            ])
                ->where(function ($q) use ($user) {
                    $q->where('assigned_user_id', $user->id)
                        ->orWhere('reviewer_user_id', $user->id);
                })
                ->get();

            $myTasks = $assignedTasks->map(fn (Task $task) => $this->formatTaskForMember($task, $user))->values()->all();

            $notifications = collect($myTasks)->map(function ($t) {
                $type = null;
                $title = null;
                $body = null;
                $icon = null;
                $color = null;

                $isReviewForMe = ! empty($t['is_reviewer']) && in_array($t['sprint_status'] ?? $t['status'] ?? '', ['waiting_for_review', 'review']);
                $isNewAssignment = ! empty($t['is_doer']) && (in_array($t['sprint_status'] ?? '', ['ready_to_start', '']) || ($t['sprint_status'] === null && $t['status'] === 'todo'));
                $isOverdue = isset($t['days_until_deadline']) && $t['days_until_deadline'] !== null && $t['days_until_deadline'] < 0;
                $isStuck = ($t['sprint_status'] ?? $t['status'] ?? '') === 'stuck';

                if ($isReviewForMe) {
                    $type = 'review_request';
                    $title = 'Code Review Requested';
                    $body = "{$t['assignee']} submitted \"{$t['title']}\" for your peer code review.";
                    $icon = 'eye';
                    $color = 'blue';
                } elseif ($isNewAssignment) {
                    $type = 'task_assigned';
                    $title = 'New Task Assigned';
                    $body = "You were assigned to \"{$t['title']}\"".(! empty($t['project_name']) ? " in {$t['project_name']}" : '').'. Ready to start!';
                    $icon = 'clipboard';
                    $color = 'indigo';
                } elseif ($isOverdue) {
                    $type = 'overdue';
                    $title = 'Task Overdue Alert';
                    $body = "\"{$t['title']}\" is past due by ".abs($t['days_until_deadline']).' day(s). Update progress or flag as stuck.';
                    $icon = 'alert';
                    $color = 'rose';
                } elseif ($isStuck) {
                    $type = 'stuck';
                    $title = 'Task Blocked / Stuck';
                    $body = "\"{$t['title']}\" is currently flagged as blocked. Team lead assistance needed.";
                    $icon = 'ban';
                    $color = 'rose';
                }

                if (! $type) {
                    return null;
                }

                return [
                    'id' => 'task-'.$t['id'].'-'.$type,
                    'type' => $type,
                    'title' => $title,
                    'body' => $body,
                    'icon' => $icon,
                    'color' => $color,
                    'task_id' => $t['id'],
                    'task_title' => $t['title'],
                    'task' => $t,
                    'project_name' => $t['project_name'] ?? null,
                    'epic_name' => $t['epic_name'] ?? null,
                    'epic_color' => $t['epic_color'] ?? null,
                    'priority' => $t['priority'] ?? null,
                    'days_until_deadline' => $t['days_until_deadline'] ?? null,
                    'read' => false,
                    'created_at_human' => 'Today',
                ];
            })->filter()->values()->all();
        } catch (\Exception $e) {
            $notifications = [];
        }

        $pendingEstimatesCount = 0;
        try {
            $pendingEstimatesCount = Task::where('story_points_locked', false)
                ->where('needs_estimate_review', false)
                ->get()
                ->filter(fn ($task) => empty($task->expected_estimators)
                    ? $task->assigned_user_id === $user->id
                    : in_array($user->id, $task->expected_estimators ?? [])
                )
                ->filter(fn ($task) => ! TaskEstimateSubmission::where('task_id', $task->id)
                    ->where('developer_id', $user->id)
                    ->exists()
                )
                ->count();
        } catch (\Exception $e) {
        }

        if ($pendingEstimatesCount > 0) {
            $notifications[] = [
                'id' => 'estimates-pending',
                'type' => 'estimate_pending',
                'title' => 'Story Point Estimation Needed',
                'body' => "You have {$pendingEstimatesCount} task(s) awaiting your Fibonacci estimate vote before sprint start.",
                'icon' => 'sparkles',
                'color' => 'amber',
                'task_id' => null,
                'task_title' => null,
                'task' => null,
                'project_name' => null,
                'epic_name' => null,
                'epic_color' => null,
                'priority' => 'high',
                'days_until_deadline' => null,
                'read' => false,
                'created_at_human' => 'Pending',
            ];
        }

        $notifications = array_merge($notifications, $this->getMessageNotifications($user));

        $teamMembers = [];
        try {
            if ($studio) {
                // Fetch latest message metadata for direct messages involving this user
                $activeDms = collect();
                if (Schema::hasTable('channel_messages')) {
                    $activeDms = ChannelMessage::where(function ($q) use ($user) {
                        $q->where('channel_id', 'like', "dm-{$user->id}_%")
                            ->orWhere('channel_id', 'like', "dm-%_{$user->id}")
                            ->orWhere('channel_id', 'like', "dm-{$user->id}-%")
                            ->orWhere('channel_id', 'like', "dm-%-{$user->id}");
                    })
                        ->where(function ($q) use ($user) {
                            $q->whereNull('deleted_for_user_ids')
                                ->orWhereJsonDoesntContain('deleted_for_user_ids', (int) $user->id);
                        })
                        ->select('channel_id', DB::raw('MAX(created_at) as last_message_at'), DB::raw('COUNT(id) as total_messages'))
                        ->groupBy('channel_id')
                        ->get()
                        ->keyBy('channel_id');
                }

                $teamMembers = $studio->users()
                    ->with('globalProfile.position')
                    ->get()
                    ->map(function ($u) use ($user, $activeDms) {
                        $dmChannelId1 = 'dm-'.min($user->id, $u->id).'_'.max($user->id, $u->id);
                        $dmChannelId2 = 'dm-'.$user->id.'-'.$u->id;
                        $dmChannelId3 = 'dm-'.$u->id.'-'.$user->id;

                        $meta = $activeDms->get($dmChannelId1)
                            ?? $activeDms->get($dmChannelId2)
                            ?? $activeDms->get($dmChannelId3);

                        $hasConversation = $meta && (int) $meta->total_messages > 0;
                        $lastMsgAt = $meta?->last_message_at ? Carbon::parse($meta->last_message_at) : null;

                        return [
                            'id' => $u->id,
                            'name' => $u->name,
                            'email' => $u->email,
                            'role' => $u->pivot?->role ?? 'member',
                            'position' => $u->globalProfile?->position?->name ?? ($u->role === 'admin' ? 'Project Lead' : 'Developer'),
                            'avatar' => $u->profile_photo_url ?? null,
                            'online' => true,
                            'is_self' => $u->id === $user->id,
                            'has_conversation' => (bool) $hasConversation,
                            'last_message_at' => $lastMsgAt?->toIso8601String(),
                            'total_messages' => (int) ($meta?->total_messages ?? 0),
                        ];
                    })
                    ->sort(function ($a, $b) {
                        // Conversations with messages should be above all the other direct messages
                        if ($a['has_conversation'] && ! $b['has_conversation']) {
                            return -1;
                        }
                        if (! $a['has_conversation'] && $b['has_conversation']) {
                            return 1;
                        }
                        if ($a['last_message_at'] && $b['last_message_at']) {
                            return strcmp($b['last_message_at'], $a['last_message_at']);
                        }
                        if ($a['last_message_at']) {
                            return -1;
                        }
                        if ($b['last_message_at']) {
                            return 1;
                        }

                        return strcasecmp($a['name'], $b['name']);
                    })
                    ->values()
                    ->all();
            }
        } catch (\Exception $e) {
        }

        return Inertia::render('Tenant/Inbox', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'notifications' => $notifications,
            'myTasks' => $myTasks,
            'teamMembers' => $teamMembers,
            'pendingEstimatesCount' => $pendingEstimatesCount,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTaskForMember(Task $task, mixed $currentUser = null): array
    {
        return [
            'id' => $task->id,
            'project_id' => $task->project_id,
            'project_name' => $task->project?->name ?? '',
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'sprint_status' => $task->sprint_status,
            'sprint_priority' => $task->sprint_priority,
            'priority' => $task->priority,
            'story_points' => $task->story_points,
            'actual_story_points' => $task->actual_story_points,
            'estimated_hours' => $task->estimated_hours,
            'task_classification' => $task->task_classification,
            'hard_constraint_date' => $task->hard_constraint_date?->format('Y-m-d'),
            'days_until_deadline' => $task->days_until_deadline,
            'github_link' => $task->github_link,
            'is_critical' => (bool) $task->is_critical,
            'assigned_user_id' => $task->assigned_user_id,
            'assignee' => $task->assignee?->name,
            'reviewer_user_id' => $task->reviewer_user_id,
            'reviewer' => $task->reviewer?->name,
            'is_reviewer' => $currentUser ? ((int) $task->reviewer_user_id === (int) $currentUser->id) : false,
            'is_doer' => $currentUser ? ((int) $task->assigned_user_id === (int) $currentUser->id) : false,
            'sprint_id' => $task->sprint_id,
            'sprint_name' => $task->sprint?->name,
            'epic_id' => $task->epic_id,
            'epic_name' => $task->epic?->name,
            'epic_color' => $task->epic?->color,
        ];
    }

    private function managerDashboard(mixed $studio): Response
    {
        $projects = [];
        try {
            $projects = Project::with(['tasks' => fn ($q) => $q->select('id', 'project_id', 'title')])
                ->withCount(['projectMembers as members_count', 'tasks'])
                ->latest()
                ->get()
                ->map(function ($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'description' => $project->description,
                        'status' => $project->status,
                        'members_count' => $project->members_count ?? 0,
                        'tasks_count' => $project->tasks_count ?? 0,
                        'tasks' => $project->tasks->map(fn ($t) => ['id' => $t->id, 'title' => $t->title]),
                    ];
                });
        } catch (\Exception $e) {
            $projects = [];
        }

        $activeTasks = [];
        try {
            $activeTasks = Task::with('assignee')
                ->whereIn('status', ['todo', 'in_progress', 'review'])
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($task) {
                    $gnnMatchScore = null;
                    try {
                        $asg = DB::table('assignments')
                            ->where('task_id', $task->id)
                            ->where('status', 'active')
                            ->first();
                        if ($asg && $asg->match_fit_score !== null) {
                            $gnnMatchScore = round($asg->match_fit_score * 100).'% Fit';
                        }
                    } catch (\Exception $e) {
                    }

                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'classification' => $task->task_classification ?? 'Engineering',
                        'estimatedHours' => $task->estimated_hours ? $task->estimated_hours.'h' : '8h',
                        'priority' => $task->priority ?? 'MEDIUM',
                        'isCriticalPath' => (bool) $task->is_critical,
                        'assignee' => $task->assignee ? $task->assignee->name : null,
                        'gnnMatchScore' => $gnnMatchScore,
                    ];
                })
                ->all();
        } catch (\Exception $e) {
            $activeTasks = [];
        }

        $skills = Skill::orderBy('name')->get(['id', 'name', 'category'])->all();
        $positions = Position::orderBy('name')->get(['id', 'name'])->all();
        $teamMembers = $studio ? $studio->users()->get()->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]) : [];

        $pendingEstimatesCount = 0;
        try {
            $user = auth()->user();
            if ($user) {
                $pendingEstimatesCount = Task::where('story_points_locked', false)
                    ->where('needs_estimate_review', false)
                    ->get()
                    ->filter(function ($task) use ($user) {
                        if (empty($task->expected_estimators)) {
                            return $task->assigned_user_id === $user->id;
                        }

                        return in_array($user->id, $task->expected_estimators);
                    })
                    ->filter(function ($task) use ($user) {
                        return ! TaskEstimateSubmission::where('task_id', $task->id)
                            ->where('developer_id', $user->id)
                            ->exists();
                    })
                    ->count();
            }
        } catch (\Exception $e) {
        }

        $teamVelocities = [];
        try {
            $teamVelocities = TeamVelocity::latest('computed_at')->take(5)->get()->toArray();
        } catch (\Exception $e) {
        }

        return Inertia::render('Tenant/Dashboard', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'projects' => $projects,
            'activeTasks' => $activeTasks,
            'skills' => $skills,
            'positions' => $positions,
            'teamMembers' => $teamMembers,
            'pendingEstimatesCount' => $pendingEstimatesCount,
            'teamVelocities' => $teamVelocities,
        ]);
    }

    /**
     * Build notifications for incoming direct messages and channel messages / mentions.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getMessageNotifications(User $user): array
    {
        $notifications = [];

        try {
            if (! Schema::hasTable('channel_messages')) {
                return [];
            }

            $userReads = collect();
            if (Schema::hasTable('channel_reads')) {
                $userReads = ChannelRead::where('user_id', $user->id)->get()->keyBy('channel_id');
            }

            // 1. Direct messages where the current user is a participant and not the author
            $recentDms = ChannelMessage::where(function ($q) use ($user) {
                $q->where('channel_id', 'like', "dm-{$user->id}_%")
                    ->orWhere('channel_id', 'like', "dm-%_{$user->id}")
                    ->orWhere('channel_id', 'like', "dm-{$user->id}-%")
                    ->orWhere('channel_id', 'like', "dm-%-{$user->id}");
            })
                ->where('user_id', '!=', $user->id)
                ->where('is_unsent', false)
                ->where(function ($q) use ($user) {
                    $q->whereNull('deleted_for_user_ids')
                        ->orWhereJsonDoesntContain('deleted_for_user_ids', (int) $user->id);
                })
                ->orderBy('created_at', 'desc')
                ->limit(15)
                ->get();

            foreach ($recentDms as $dm) {
                $hasAttachments = ! empty($dm->attachments);
                $snippet = $dm->body !== '' ? Str::limit($dm->body, 90) : ($hasAttachments ? 'Sent an attachment' : 'Sent a message');

                $userRead = $userReads->get($dm->channel_id);
                $isRead = false;
                if ($userRead) {
                    if ($userRead->last_read_message_id && $dm->id <= $userRead->last_read_message_id) {
                        $isRead = true;
                    } elseif ($userRead->last_read_at && $dm->created_at <= $userRead->last_read_at) {
                        $isRead = true;
                    }
                }

                $notifications[] = [
                    'id' => 'msg-'.$dm->id,
                    'type' => 'direct_message',
                    'title' => "Message from {$dm->sender_name}",
                    'body' => $snippet,
                    'icon' => 'message',
                    'color' => 'emerald',
                    'channel_id' => $dm->channel_id,
                    'sender_id' => $dm->user_id,
                    'sender_name' => $dm->sender_name,
                    'chat_type' => 'dm',
                    'task_id' => null,
                    'task_title' => null,
                    'task' => null,
                    'project_name' => null,
                    'epic_name' => null,
                    'epic_color' => null,
                    'priority' => 'high',
                    'days_until_deadline' => null,
                    'read' => $isRead,
                    'created_at_human' => $dm->created_at?->diffForHumans() ?? 'Recent',
                ];
            }

            // 2. Channel messages (mentions + general messages from other teammates)
            $recentChannelMsgs = ChannelMessage::where('channel_id', 'not like', 'dm-%')
                ->where('user_id', '!=', $user->id)
                ->where('is_unsent', false)
                ->where(function ($q) use ($user) {
                    $q->whereNull('deleted_for_user_ids')
                        ->orWhereJsonDoesntContain('deleted_for_user_ids', (int) $user->id);
                })
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            foreach ($recentChannelMsgs as $chMsg) {
                $isMention = (! empty($chMsg->mentions) && in_array((int) $user->id, $chMsg->mentions))
                    || str_contains(strtolower($chMsg->body), '@'.strtolower($user->name));

                $chTitle = str_starts_with($chMsg->channel_id, 'ch-')
                    ? '#'.str_replace('ch-', '', $chMsg->channel_id)
                    : '#'.$chMsg->channel_id;

                $snippet = $chMsg->body !== '' ? Str::limit($chMsg->body, 90) : (! empty($chMsg->attachments) ? 'Sent an attachment' : 'Sent a message');

                $userRead = $userReads->get($chMsg->channel_id);
                $isRead = false;
                if ($userRead) {
                    if ($userRead->last_read_message_id && $chMsg->id <= $userRead->last_read_message_id) {
                        $isRead = true;
                    } elseif ($userRead->last_read_at && $chMsg->created_at <= $userRead->last_read_at) {
                        $isRead = true;
                    }
                }

                $notifications[] = [
                    'id' => ($isMention ? 'mention-' : 'channel-').$chMsg->id,
                    'type' => $isMention ? 'channel_mention' : 'channel_message',
                    'title' => $isMention ? "Mentioned in {$chTitle}" : "New message in {$chTitle}",
                    'body' => "{$chMsg->sender_name}: \"{$snippet}\"",
                    'icon' => $isMention ? 'sparkles' : 'message',
                    'color' => $isMention ? 'indigo' : 'blue',
                    'channel_id' => $chMsg->channel_id,
                    'sender_id' => $chMsg->user_id,
                    'sender_name' => $chMsg->sender_name,
                    'chat_type' => 'channel',
                    'task_id' => null,
                    'task_title' => null,
                    'task' => null,
                    'project_name' => null,
                    'epic_name' => null,
                    'epic_color' => null,
                    'priority' => $isMention ? 'high' : 'medium',
                    'days_until_deadline' => null,
                    'read' => $isRead,
                    'created_at_human' => $chMsg->created_at?->diffForHumans() ?? 'Recent',
                ];
            }
        } catch (\Throwable $e) {
            // Ignore failure
        }

        return $notifications;
    }

    /**
     * Mark all message notifications as read for current user.
     */
    public function markAllNotificationsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        if (Schema::hasTable('channel_reads') && Schema::hasTable('channel_messages')) {
            $activeChannels = ChannelMessage::where('created_at', '>=', now()->subDays(14))
                ->select('channel_id', DB::raw('MAX(id) as max_id'))
                ->groupBy('channel_id')
                ->get();

            foreach ($activeChannels as $ch) {
                ChannelRead::updateOrCreate(
                    [
                        'channel_id' => $ch->channel_id,
                        'user_id' => $user->id,
                    ],
                    [
                        'last_read_message_id' => $ch->max_id,
                        'last_read_at' => now(),
                    ]
                );
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Mark an individual notification as read.
     */
    public function markNotificationRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (str_starts_with($id, 'msg-') || str_starts_with($id, 'channel-') || str_starts_with($id, 'mention-')) {
            $msgId = (int) preg_replace('/^[a-z]+-/', '', $id);
            $msg = ChannelMessage::find($msgId);
            if ($msg && Schema::hasTable('channel_reads')) {
                $latestId = ChannelMessage::where('channel_id', $msg->channel_id)->max('id') ?? $msg->id;
                ChannelRead::updateOrCreate(
                    [
                        'channel_id' => $msg->channel_id,
                        'user_id' => $user->id,
                    ],
                    [
                        'last_read_message_id' => $latestId,
                        'last_read_at' => now(),
                    ]
                );
            }
        }

        return response()->json(['success' => true]);
    }
}
