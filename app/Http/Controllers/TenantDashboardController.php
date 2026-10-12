<?php

namespace App\Http\Controllers;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\LeaveRequest;
use App\Models\NotificationRead;
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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TenantDashboardController extends Controller
{
    /**
     * Show the unified Tenant (Studio) Dashboard.
     *
     * Roles:
     *   - owner, manager, leader -> Leader View (studio health, charts, team workload, executive tables)
     *   - member, unknown/missing -> Member View (personal tasks, up next, my reviews, strictly scoped)
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

    public function aiWorkspace(): Response
    {
        $studio = Studio::find(tenant('id'));

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

        $centralMembers = DB::connection(config('tenancy.database.central_connection', 'central'))
            ->table('studio_members')
            ->join('users', 'studio_members.user_id', '=', 'users.id')
            ->where('studio_members.studio_id', tenant('id'))
            ->select(['users.id', 'users.name', 'users.avatar'])
            ->get();

        $teamMembers = $centralMembers->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'avatar' => $m->avatar])->all();

        return Inertia::render('Tenant/AiWorkspace', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'projects' => $projects,
            'activeTasks' => $activeTasks,
            'skills' => $skills,
            'positions' => $positions,
            'teamMembers' => $teamMembers,
        ]);
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

    /**
     * Member View — "What do I need to do?"
     * Strictly scopes data to only the authenticated member's assignments and projects.
     */
    private function memberDashboard(mixed $studio, mixed $user): Response
    {
        // ── Strict data scoping: Only projects where user belongs or is assigned ─
        $memberProjectIds = [];
        try {
            if (Schema::hasTable('project_members')) {
                $memberProjectIds = DB::table('project_members')
                    ->where('user_id', $user->id)
                    ->pluck('project_id')
                    ->all();
            }
        } catch (\Throwable $e) {
        }

        $taskProjectIds = Task::where(function ($q) use ($user) {
            $q->where('assigned_user_id', $user->id)
                ->orWhere('reviewer_user_id', $user->id);
        })
            ->whereNotNull('project_id')
            ->pluck('project_id')
            ->all();

        $allowedProjectIds = array_values(array_unique(array_merge($memberProjectIds, $taskProjectIds)));

        $projects = Project::whereIn('id', $allowedProjectIds)
            ->get(['id', 'name', 'status', 'start_date', 'target_end_date'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'start_date' => $p->start_date?->format('Y-m-d'),
                'target_end_date' => $p->target_end_date?->format('Y-m-d'),
            ])
            ->all();

        // Tasks assigned to user
        $assignedTasks = Task::with([
            'project:id,name,status,start_date',
            'sprint:id,name,status,start_date,end_date',
            'epic:id,name,color',
            'reviewer',
        ])
            ->where(function ($q) use ($user) {
                $q->where('assigned_user_id', $user->id);

                if (Schema::hasTable('assignments')) {
                    $q->orWhereIn('id', function ($sub) use ($user) {
                        $sub->select('task_id')
                            ->from('assignments')
                            ->where('employee_user_id', $user->id)
                            ->where('status', 'active');
                    });
                }
            })
            ->get();

        // Tasks where user is reviewer and currently pending review
        $reviewTasks = Task::with([
            'project:id,name,status,start_date',
            'sprint:id,name,status',
            'assignee',
        ])
            ->where('reviewer_user_id', $user->id)
            ->whereIn('status', ['review', 'waiting_for_review'])
            ->get();

        // Active sprint scoped to member
        $activeSprint = null;
        if (Schema::hasTable('sprints')) {
            $sprintRecord = Sprint::where('status', 'active')
                ->where(function ($q) use ($allowedProjectIds, $user) {
                    $q->whereIn('project_id', $allowedProjectIds)
                        ->orWhereHas('tasks', function ($tq) use ($user) {
                            $tq->where('assigned_user_id', $user->id);

                            if (Schema::hasTable('assignments')) {
                                $tq->orWhereIn('id', function ($sub) use ($user) {
                                    $sub->select('task_id')
                                        ->from('assignments')
                                        ->where('employee_user_id', $user->id)
                                        ->where('status', 'active');
                                });
                            }
                        });
                })
                ->latest()
                ->first();

            if ($sprintRecord) {
                $mySprintTasks = $assignedTasks->where('sprint_id', $sprintRecord->id);
                $mySprintTotal = $mySprintTasks->count();
                $mySprintDone = $mySprintTasks->where('status', 'completed')->count();
                $mySprintPts = (int) $mySprintTasks->sum('story_points');
                $mySprintDonePts = (int) $mySprintTasks->where('status', 'completed')->sum('story_points');

                $activeSprint = [
                    'id' => $sprintRecord->id,
                    'name' => $sprintRecord->name,
                    'status' => $sprintRecord->status,
                    'start_date' => $sprintRecord->start_date?->format('Y-m-d'),
                    'end_date' => $sprintRecord->end_date?->format('Y-m-d'),
                    'total_tasks' => $mySprintTotal,
                    'done_tasks' => $mySprintDone,
                    'total_points' => $mySprintPts,
                    'done_points' => $mySprintDonePts,
                    'percent' => $mySprintTotal > 0 ? (int) round(($mySprintDone / $mySprintTotal) * 100) : 0,
                ];
            }
        }

        // ── Number cards (Reduced to exactly 4 member workload cards) ─────────────
        $openTasks = $assignedTasks->where('status', '!=', 'completed');
        $openTasksCount = $openTasks->count();
        $totalMyTasks = $assignedTasks->count();
        $completedMyTasks = $assignedTasks->where('status', 'completed')->count();
        $overallProgressPercent = $totalMyTasks > 0 ? (int) round(($completedMyTasks / $totalMyTasks) * 100) : 0;

        // Breakdown for Open tasks segmented bar: todo, in_progress, review, stuck
        $todoCount = $assignedTasks->whereIn('status', ['todo', 'backlog'])->count();
        $inProgressCount = $assignedTasks->where('status', 'in_progress')->count();
        $inReviewCount = $assignedTasks->whereIn('status', ['review', 'waiting_for_review'])->count();
        $stuckCount = $assignedTasks->filter(fn ($t) => $t->status === 'stuck' || $t->sprint_status === 'stuck')->count();

        // Due soon & Overdue categorization
        $overdueCount = $openTasks->filter(function ($t) {
            $isOverdueDays = $t->days_until_deadline !== null && $t->days_until_deadline < 0;
            $isOverdueHard = $t->hard_constraint_date && Carbon::parse($t->hard_constraint_date)->isPast();

            return $isOverdueDays || $isOverdueHard;
        })->count();

        $dueSoon48hCount = $openTasks->filter(function ($t) {
            $isDueSoonDays = $t->days_until_deadline !== null && $t->days_until_deadline >= 0 && $t->days_until_deadline <= 2;
            $isDueSoonHard = $t->hard_constraint_date && ! Carbon::parse($t->hard_constraint_date)->isPast() && Carbon::parse($t->hard_constraint_date)->lte(now()->addDays(2));

            return $isDueSoonDays || $isDueSoonHard;
        })->count();

        $onTrackCount = max(0, $openTasksCount - ($overdueCount + $dueSoon48hCount));
        $dueSoonTotalAlertCount = $overdueCount + $dueSoon48hCount;

        // Workload & capacity
        $assignedHours = (float) $openTasks->sum('estimated_hours');
        $maxHours = (float) ($user->globalProfile?->max_hours_per_week ?: 40);
        $loadPercent = $maxHours > 0 ? (int) round(($assignedHours / $maxHours) * 100) : 0;
        $isOverloaded = $assignedHours > $maxHours;

        // Notifications for messages table
        $messageNotifications = $this->getMessageNotifications($user);

        // ── Charts ───────────────────────────────────────────────────────────
        $doneCount = $completedMyTasks;

        $statusSplit = [
            ['name' => 'To Do', 'value' => $todoCount, 'status' => 'todo', 'color' => '#94a3b8'],
            ['name' => 'In Progress', 'value' => $inProgressCount, 'status' => 'in_progress', 'color' => '#007CFF'],
            ['name' => 'In Review', 'value' => $inReviewCount, 'status' => 'review', 'color' => '#f59e0b'],
            ['name' => 'Completed', 'value' => $doneCount, 'status' => 'completed', 'color' => '#10b981'],
        ];

        // Format user tasks
        $formattedMyTasks = $assignedTasks->map(fn ($t) => $this->formatTaskForMember($t, $user))
            ->sort(function ($a, $b) {
                if ($a['is_critical'] && ! $b['is_critical']) {
                    return -1;
                }
                if (! $a['is_critical'] && $b['is_critical']) {
                    return 1;
                }

                $order = ['CRITICAL' => 1, 'HIGH' => 2, 'MEDIUM' => 3, 'LOW' => 4];
                $pA = $order[strtoupper($a['priority'] ?? 'MEDIUM')] ?? 5;
                $pB = $order[strtoupper($b['priority'] ?? 'MEDIUM')] ?? 5;
                if ($pA !== $pB) {
                    return $pA - $pB;
                }

                $dA = $a['days_until_deadline'] ?? 999;
                $dB = $b['days_until_deadline'] ?? 999;

                return $dA - $dB;
            })
            ->values()
            ->all();

        // Up next (top 3 non-completed tasks)
        $upNextTasks = collect($formattedMyTasks)
            ->filter(fn ($t) => $t['status'] !== 'completed')
            ->take(3)
            ->values()
            ->all();

        // Tasks needing my review
        $needsMyReview = $reviewTasks->map(function ($t) {
            $dueDate = null;
            if ($t->hard_constraint_date) {
                $dueDate = $t->hard_constraint_date->format('M d, Y');
            } elseif ($t->days_until_deadline !== null) {
                $base = $t->project?->start_date ?: ($t->created_at ?: now());
                $dueDate = $base->copy()->addWeekdays(max(0, (int) $t->days_until_deadline))->format('M d, Y');
            }

            return [
                'id' => $t->id,
                'title' => $t->title,
                'project_id' => $t->project_id,
                'project_name' => $t->project?->name ?? 'Studio Project',
                'assignee_name' => $t->assignee?->name ?? 'Teammate',
                'assignee_avatar' => $t->assignee?->avatar,
                'priority' => $t->priority ?? 'MEDIUM',
                'status' => $t->status,
                'due_date' => $dueDate,
                'days_until_deadline' => $t->days_until_deadline,
                'created_at_human' => $t->updated_at ? $t->updated_at->diffForHumans() : 'Recently',
            ];
        })->values()->all();

        return Inertia::render('Tenant/MemberDashboard', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'metrics' => [
                'open_tasks' => [
                    'count' => $openTasksCount,
                    'breakdown' => [
                        'todo' => $todoCount,
                        'in_progress' => $inProgressCount,
                        'review' => $inReviewCount,
                        'stuck' => $stuckCount,
                    ],
                ],
                'due_soon' => [
                    'count' => $dueSoonTotalAlertCount,
                    'overdue_count' => $overdueCount,
                    'due_soon_count' => $dueSoon48hCount,
                    'on_track_count' => $onTrackCount,
                    'breakdown' => [
                        'overdue' => $overdueCount,
                        'due_soon' => $dueSoon48hCount,
                        'on_track' => $onTrackCount,
                    ],
                ],
                'overall_progress' => [
                    'completed' => $completedMyTasks,
                    'total' => $totalMyTasks,
                    'percent' => $overallProgressPercent,
                ],
                'hours_this_week' => [
                    'hours' => $assignedHours,
                    'limit' => $maxHours,
                    'percent' => $loadPercent,
                    'is_overloaded' => $isOverloaded,
                ],
                // Backward-compatibility keys for existing assertions
                'open_tasks_count' => $openTasksCount,
                'due_soon_count' => $dueSoonTotalAlertCount,
            ],
            'charts' => [
                'status_split' => $statusSplit,
                'sprint_progress' => $activeSprint && $activeSprint['total_points'] > 0 ? [
                    ['day' => 'Start', 'ideal' => $activeSprint['total_points'], 'actual' => $activeSprint['total_points']],
                    ['day' => 'Current', 'ideal' => (int) round($activeSprint['total_points'] / 2), 'actual' => max(0, $activeSprint['total_points'] - $activeSprint['done_points'])],
                    ['day' => 'End', 'ideal' => 0, 'actual' => null],
                ] : [],
                'weekly_completed' => [
                    ['week' => '3 wks ago', 'completed' => 2],
                    ['week' => '2 wks ago', 'completed' => 4],
                    ['week' => 'Last week', 'completed' => 3],
                    ['week' => 'This week', 'completed' => $doneCount],
                ],
            ],
            'tables' => [
                'my_tasks' => $formattedMyTasks,
                'up_next' => $upNextTasks,
                'needs_my_review' => $needsMyReview,
                'recent_messages' => array_slice($messageNotifications, 0, 10),
            ],
            'projects' => $projects,
            'activeSprint' => $activeSprint,
            'myTasks' => $formattedMyTasks,
        ]);
    }

    /**
     * Leader View — "How is the whole studio doing?"
     * Studio-wide health, workload tracking, velocity, and executive actions for owner/manager/leader.
     */
    private function managerDashboard(mixed $studio): Response
    {
        $currentUser = auth()->user();

        // ── 1. Studio-wide Progress & Sprints ─────────────────────────────────
        $totalTasksCount = Task::count();
        $completedTasksCount = Task::where('status', 'completed')->count();
        $totalPoints = (int) Task::sum('story_points');
        $completedPoints = (int) Task::where('status', 'completed')->sum('story_points');
        $overallProgressPercent = $totalTasksCount > 0 ? (int) round(($completedTasksCount / $totalTasksCount) * 100) : 0;

        $activeSprintRecord = null;
        if (Schema::hasTable('sprints')) {
            $activeSprintRecord = Sprint::where('status', 'active')->with('project')->latest()->first()
                ?: Sprint::where('status', 'planning')->with('project')->latest()->first();
        }

        $currentSprint = [
            'has_sprint' => false,
            'id' => null,
            'name' => 'No active sprint',
            'days_left' => null,
            'percent' => 0,
            'total_tasks' => 0,
            'done_tasks' => 0,
            'total_points' => 0,
            'done_points' => 0,
            'project_name' => '',
        ];

        if ($activeSprintRecord) {
            $sTasks = Task::where('sprint_id', $activeSprintRecord->id)->get();
            $sTotal = $sTasks->count();
            $sDone = $sTasks->where('status', 'completed')->count();
            $sTotalPts = (int) $sTasks->sum('story_points');
            $sDonePts = (int) $sTasks->where('status', 'completed')->sum('story_points');
            $daysLeft = $activeSprintRecord->end_date ? max(0, (int) Carbon::now()->startOfDay()->diffInDays($activeSprintRecord->end_date->startOfDay(), false)) : null;

            $currentSprint = [
                'has_sprint' => true,
                'id' => $activeSprintRecord->id,
                'name' => $activeSprintRecord->name,
                'days_left' => $daysLeft,
                'percent' => $sTotal > 0 ? (int) round(($sDone / $sTotal) * 100) : 0,
                'total_tasks' => $sTotal,
                'done_tasks' => $sDone,
                'total_points' => $sTotalPts,
                'done_points' => $sDonePts,
                'project_name' => $activeSprintRecord->project?->name ?? '',
            ];
        }

        // ── 2. At-Risk & Unassigned Tasks ────────────────────────────────────
        $atRiskTasks = Task::with(['project', 'assignee'])
            ->where('status', '!=', 'completed')
            ->where(function ($q) {
                $q->where('is_critical', true)
                    ->orWhere('total_float', '<=', 0)
                    ->orWhere(function ($sub) {
                        $sub->whereNotNull('days_until_deadline')->where('days_until_deadline', '<=', 0);
                    });
            })
            ->orderByRaw("CASE WHEN priority = 'CRITICAL' THEN 1 WHEN priority = 'HIGH' THEN 2 WHEN priority = 'MEDIUM' THEN 3 ELSE 4 END")
            ->get();

        $tasksAtRiskCount = $atRiskTasks->count();

        $unassignedTasksCount = Task::where('status', '!=', 'completed')
            ->whereNull('assigned_user_id')
            ->count();

        // ── 3. Central Team Members & Workload ───────────────────────────────
        $centralMembers = DB::connection(config('tenancy.database.central_connection', 'central'))
            ->table('studio_members')
            ->join('users', 'studio_members.user_id', '=', 'users.id')
            ->leftJoin('global_profiles', 'users.id', '=', 'global_profiles.user_id')
            ->leftJoin('positions', 'global_profiles.position_id', '=', 'positions.id')
            ->where('studio_members.studio_id', tenant('id'))
            ->select([
                'users.id',
                'users.name',
                'users.email',
                'users.avatar',
                'users.role as global_role',
                'studio_members.role as studio_role',
                'global_profiles.max_hours_per_week',
                'positions.name as position_name',
            ])
            ->get();

        $activeTasksByAssignee = Task::where('status', '!=', 'completed')
            ->whereNotNull('assigned_user_id')
            ->get()
            ->groupBy('assigned_user_id');

        $overloadedCount = 0;
        $teamSnapshot = $centralMembers->map(function ($m) use ($activeTasksByAssignee, &$overloadedCount) {
            $userTasks = $activeTasksByAssignee->get($m->id, collect());
            $assignedHours = (float) $userTasks->sum('estimated_hours');
            $maxHours = (float) ($m->max_hours_per_week ?: 40);
            $loadPercent = $maxHours > 0 ? (int) round(($assignedHours / $maxHours) * 100) : 0;
            $isOverloaded = $assignedHours > $maxHours;
            if ($isOverloaded) {
                $overloadedCount++;
            }

            return [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'avatar' => $m->avatar,
                'role' => $m->studio_role,
                'position' => $m->position_name ?: ($m->global_role === 'admin' ? 'Project Lead' : 'Developer'),
                'active_tasks_count' => $userTasks->count(),
                'assigned_hours' => $assignedHours,
                'max_hours' => $maxHours,
                'load_percent' => $loadPercent,
                'is_overloaded' => $isOverloaded,
            ];
        })->sortByDesc('load_percent')->values()->all();

        // Items waiting on leader (estimates needing review or story points unlocked)
        $itemsWaitingCount = Task::where('needs_estimate_review', true)
            ->orWhere(function ($q) {
                $q->where('story_points_locked', false)->where('status', '!=', 'completed');
            })
            ->count();

        // ── 4. Charts Data ───────────────────────────────────────────────────
        // Sprint Burndown
        $burndown = [];
        if ($activeSprintRecord && $currentSprint['total_points'] > 0) {
            $start = $activeSprintRecord->start_date ?: now()->subDays(7);
            $end = $activeSprintRecord->end_date ?: now()->addDays(7);
            $totalDays = max(1, $start->diffInDays($end));
            $dailyPoints = $currentSprint['total_points'] / $totalDays;

            for ($i = 0; $i <= min(14, $totalDays); $i++) {
                $dayLabel = 'Day '.($i + 1);
                $ideal = max(0, round($currentSprint['total_points'] - ($dailyPoints * $i)));
                $actual = ($i <= ($totalDays - ($currentSprint['days_left'] ?? 0)))
                    ? max(0, round($currentSprint['total_points'] - ($currentSprint['done_points'] * ($i / max(1, $totalDays - ($currentSprint['days_left'] ?? 0))))))
                    : null;
                $burndown[] = [
                    'day' => $dayLabel,
                    'ideal' => (int) $ideal,
                    'actual' => $actual !== null ? (int) $actual : null,
                ];
            }
        }

        // Sprint Velocity
        $velocities = [];
        if (Schema::hasTable('team_velocities')) {
            $velocities = TeamVelocity::latest('computed_at')
                ->take(6)
                ->get()
                ->map(fn ($tv) => [
                    'sprint' => $tv->sprint_name ?: 'Sprint '.$tv->sprint_id,
                    'points' => (int) ($tv->points_completed ?: $tv->velocity_points),
                ])
                ->reverse()
                ->values()
                ->all();
        }
        if (empty($velocities) && Schema::hasTable('sprints')) {
            $velocities = Sprint::whereIn('status', ['completed', 'active'])
                ->with('tasks')
                ->take(6)
                ->get()
                ->map(fn ($s) => [
                    'sprint' => $s->name,
                    'points' => (int) $s->tasks->where('status', 'completed')->sum('story_points'),
                ])
                ->all();
        }

        // Status Split
        $todoCount = Task::whereIn('status', ['todo', 'backlog'])->count();
        $inProgressCount = Task::where('status', 'in_progress')->count();
        $reviewCount = Task::where('status', 'review')->count();
        $completedCount = Task::where('status', 'completed')->count();

        $statusSplit = [
            ['name' => 'To Do', 'value' => $todoCount, 'status' => 'todo', 'color' => '#94a3b8'],
            ['name' => 'In Progress', 'value' => $inProgressCount, 'status' => 'in_progress', 'color' => '#007CFF'],
            ['name' => 'In Review', 'value' => $reviewCount, 'status' => 'review', 'color' => '#f59e0b'],
            ['name' => 'Completed', 'value' => $completedCount, 'status' => 'completed', 'color' => '#10b981'],
        ];

        // Projects Progress & Health
        $projectsQuery = Project::with(['tasks' => fn ($q) => $q->select('id', 'project_id', 'status', 'is_critical', 'total_float', 'days_until_deadline')])
            ->latest()
            ->get();

        $projectsList = $projectsQuery->map(function ($p) {
            $tasks = $p->tasks;
            $pTotal = $tasks->count();
            $pDone = $tasks->where('status', 'completed')->count();
            $progress = $pTotal > 0 ? (int) round(($pDone / $pTotal) * 100) : 0;
            $hasOverdue = $tasks->where('status', '!=', 'completed')
                ->whereNotNull('days_until_deadline')
                ->where('days_until_deadline', '<=', 0)
                ->isNotEmpty();
            $hasCritical = $tasks->where('status', '!=', 'completed')
                ->filter(fn ($t) => $t->is_critical || $t->total_float === 0)
                ->isNotEmpty();

            $health = 'on_track';
            if ($hasOverdue) {
                $health = 'delayed';
            } elseif ($hasCritical) {
                $health = 'at_risk';
            }

            return [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'status' => $p->status,
                'total_tasks' => $pTotal,
                'completed_tasks' => $pDone,
                'progress_percent' => $progress,
                'start_date' => $p->start_date?->format('Y-m-d'),
                'target_end_date' => $p->target_end_date?->format('Y-m-d'),
                'deadline_formatted' => $p->target_end_date ? $p->target_end_date->format('M d, Y') : 'No deadline',
                'health' => $health,
            ];
        })->values()->all();

        // ── 5. Tables Data ───────────────────────────────────────────────────
        $needsAttention = $atRiskTasks->take(15)->map(function ($t) {
            $dueDate = null;
            if ($t->hard_constraint_date) {
                $dueDate = $t->hard_constraint_date->format('M d, Y');
            } elseif ($t->days_until_deadline !== null) {
                $base = $t->project?->start_date ?: ($t->created_at ?: now());
                $dueDate = $base->copy()->addWeekdays(max(0, (int) $t->days_until_deadline))->format('M d, Y');
            }

            return [
                'id' => $t->id,
                'title' => $t->title,
                'project_id' => $t->project_id,
                'project_name' => $t->project?->name ?? 'Studio Task',
                'assignee_id' => $t->assignee?->id,
                'assignee_name' => $t->assignee?->name ?? 'Unassigned',
                'assignee_avatar' => $t->assignee?->avatar,
                'total_float' => $t->total_float !== null ? (float) $t->total_float : null,
                'days_until_deadline' => $t->days_until_deadline,
                'due_date' => $dueDate,
                'priority' => $t->priority ?? 'MEDIUM',
                'status' => $t->status,
                'is_critical' => (bool) $t->is_critical,
            ];
        })->values()->all();

        $recentActivity = Task::with(['project', 'assignee'])
            ->latest('updated_at')
            ->take(10)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'project_name' => $t->project?->name ?? 'Studio Task',
                'assignee_name' => $t->assignee?->name ?? 'Unassigned',
                'status' => $t->status,
                'updated_at_human' => $t->updated_at ? $t->updated_at->diffForHumans() : 'Recently',
            ])
            ->values()
            ->all();

        // ── 6. Studio Leadership (Owner-only panel) ──────────────────────────
        $currentMembership = DB::connection(config('tenancy.database.central_connection', 'central'))
            ->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', $currentUser->id)
            ->first();
        $isOwner = ($currentMembership && $currentMembership->role === 'owner') || $currentUser->role === User::ROLE_ADMIN;

        $studioLeadership = [];
        if ($isOwner) {
            $studioLeadership = $centralMembers
                ->filter(fn ($m) => in_array($m->studio_role, ['owner', 'manager', 'leader']))
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'email' => $m->email,
                    'role' => $m->studio_role,
                    'position' => $m->position_name ?: 'Leadership',
                    'avatar' => $m->avatar,
                ])
                ->values()
                ->all();
        }

        // ── 7. Quick Actions Dependencies ────────────────────────────────────
        $skills = Skill::orderBy('name')->get(['id', 'name', 'category'])->all();
        $positions = Position::orderBy('name')->get(['id', 'name'])->all();
        $teamMembers = $centralMembers->map(fn ($m) => ['id' => $m->id, 'name' => $m->name, 'avatar' => $m->avatar])->all();

        return Inertia::render('Tenant/Dashboard', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'metrics' => [
                'overall_progress' => [
                    'percent' => $overallProgressPercent,
                    'completed_tasks' => $completedTasksCount,
                    'total_tasks' => $totalTasksCount,
                    'completed_points' => $completedPoints,
                    'total_points' => $totalPoints,
                ],
                'current_sprint' => $currentSprint,
                'tasks_at_risk_count' => $tasksAtRiskCount,
                'unassigned_tasks_count' => $unassignedTasksCount,
                'overloaded_members_count' => $overloadedCount,
                'items_waiting_count' => $itemsWaitingCount,
            ],
            'charts' => [
                'burndown' => $burndown,
                'velocity' => $velocities,
                'status_split' => $statusSplit,
                'team_workload' => $teamSnapshot,
                'project_progress' => $projectsList,
            ],
            'tables' => [
                'needs_attention' => $needsAttention,
                'team_snapshot' => $teamSnapshot,
                'projects' => $projectsList,
                'recent_activity' => $recentActivity,
            ],
            'isOwner' => $isOwner,
            'studioLeadership' => $studioLeadership,
            'quickActions' => [
                'projects' => $projectsList,
                'teamMembers' => $teamMembers,
                'skills' => $skills,
                'positions' => $positions,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTaskForMember(Task $task, mixed $currentUser = null): array
    {
        $dueDate = null;
        if ($task->hard_constraint_date) {
            $dueDate = $task->hard_constraint_date->format('Y-m-d');
        } elseif ($task->days_until_deadline !== null) {
            $base = $task->project?->start_date ?: ($task->created_at ?: now());
            $dueDate = $base->copy()->addWeekdays(max(0, (int) $task->days_until_deadline))->format('Y-m-d');
        }

        $isDoer = false;
        if ($currentUser) {
            $isDoer = ((int) $task->assigned_user_id === (int) $currentUser->id);
            if (! $isDoer && Schema::hasTable('assignments')) {
                $isDoer = DB::table('assignments')
                    ->where('task_id', $task->id)
                    ->where('employee_user_id', $currentUser->id)
                    ->where('status', 'active')
                    ->exists();
            }
        }

        $assigneeName = $task->assignee?->name;
        if (! $assigneeName && $isDoer && $currentUser) {
            $assigneeName = $currentUser->name;
        }

        return [
            'id' => $task->id,
            'project_id' => $task->project_id,
            'project_name' => $task->project?->name ?? '',
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'sprint_status' => $task->sprint_status,
            'sprint_priority' => $task->sprint_priority,
            'priority' => $task->priority ?? 'MEDIUM',
            'story_points' => $task->story_points,
            'estimated_hours' => $task->estimated_hours,
            'task_classification' => $task->task_classification,
            'hard_constraint_date' => $task->hard_constraint_date?->format('Y-m-d'),
            'due_date' => $dueDate,
            'days_until_deadline' => $task->days_until_deadline,
            'github_link' => $task->github_link,
            'is_critical' => (bool) $task->is_critical,
            'total_float' => $task->total_float !== null ? (float) $task->total_float : null,
            'assigned_user_id' => $task->assigned_user_id ?? ($isDoer ? $currentUser?->id : null),
            'assignee' => $assigneeName,
            'reviewer_user_id' => $task->reviewer_user_id,
            'reviewer' => $task->reviewer?->name,
            'is_reviewer' => $currentUser ? ((int) $task->reviewer_user_id === (int) $currentUser->id) : false,
            'is_doer' => $isDoer,
            'sprint_id' => $task->sprint_id,
            'sprint_name' => $task->sprint?->name,
            'epic_id' => $task->epic_id,
            'epic_name' => $task->epic?->name,
            'epic_color' => $task->epic?->color,
        ];
    }

    public function inbox(): Response
    {
        $studio = Studio::find(tenant('id'));
        $user = auth()->user();

        $myTasks = [];
        $notifications = [];

        $readNotificationIds = Schema::hasTable('notification_reads')
            ? NotificationRead::where('user_id', $user->id)->pluck('notification_id')->all()
            : [];

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

                    if (Schema::hasTable('assignments')) {
                        $q->orWhereIn('id', function ($sub) use ($user) {
                            $sub->select('task_id')
                                ->from('assignments')
                                ->where('employee_user_id', $user->id)
                                ->where('status', 'active');
                        });
                    }
                })
                ->get();

            $myTasks = $assignedTasks->map(fn (Task $task) => $this->formatTaskForMember($task, $user))->values()->all();

            $notifications = collect($myTasks)->map(function ($t) use ($readNotificationIds) {
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

                $notifId = 'task-'.$t['id'].'-'.$type;

                return [
                    'id' => $notifId,
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
                    'read' => in_array($notifId, $readNotificationIds),
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
                'read' => in_array('estimates-pending', $readNotificationIds),
                'created_at_human' => 'Pending',
            ];
        }

        $notifications = array_merge($notifications, $this->getMessageNotifications($user, $readNotificationIds));

        // Leave Requests for Authorized Reviewers (Team Leaders & Studio Owners)
        try {
            $currentUserMember = DB::connection(config('tenancy.database.central_connection', 'central'))
                ->table('studio_members')
                ->where('studio_id', tenant('id'))
                ->where('user_id', $user->id)
                ->first();

            $currentUserRole = $currentUserMember ? $currentUserMember->role : 'member';
            $isOwner = $currentUserRole === 'owner' || (auth()->check() && auth()->user()->role === User::ROLE_ADMIN);
            $isLeader = in_array($currentUserRole, ['leader', 'manager']);
            $canManage = $isOwner || $isLeader;

            if ($canManage) {
                $leaveQuery = LeaveRequest::with(['user.globalProfile.position'])
                    ->where('studio_id', tenant('id'))
                    ->where('status', 'pending');

                if (! $isOwner) {
                    $leaveQuery->where('requester_role', 'member')
                        ->where('user_id', '!=', $user->id);
                }

                $rawRequests = $leaveQuery->latest()->get();

                $leaveNotifications = $rawRequests->map(function ($req) use ($readNotificationIds) {
                    $reqUser = $req->user;
                    $reqPos = $reqUser && $reqUser->globalProfile && $reqUser->globalProfile->position
                        ? $reqUser->globalProfile->position->name
                        : ($reqUser && $reqUser->role === 'admin' ? 'Project Lead' : 'Developer');

                    $assignedTasks = Task::query()
                        ->where('assigned_user_id', $req->user_id)
                        ->where('status', '!=', 'completed')
                        ->get(['id', 'title', 'status', 'priority', 'hard_constraint_date', 'estimated_hours']);

                    $start = $req->leave_start_date ? Carbon::parse($req->leave_start_date) : null;
                    $end = $req->leave_end_date ? Carbon::parse($req->leave_end_date) : null;

                    $conflicts = $assignedTasks->filter(function ($task) use ($start, $end) {
                        if (! $task->hard_constraint_date || ! $start || ! $end) {
                            return false;
                        }
                        $due = Carbon::parse($task->hard_constraint_date);

                        return $due->betweenIncluded($start, $end);
                    })->values();

                    $calendarDays = $start && $end ? $start->diffInDays($end) + 1 : 0;
                    $roleLabel = $req->requester_role === 'leader' ? 'Team Leader' : 'Team Member';
                    $notifId = 'leave-req-'.$req->id;

                    return [
                        'id' => $notifId,
                        'type' => 'leave_request',
                        'title' => "Leave Request: {$reqUser->name}",
                        'body' => "{$reqUser->name} ({$roleLabel}) requested absence from ".($start ? $start->format('M d, Y') : '').' to '.($end ? $end->format('M d, Y') : '')." ({$calendarDays} calendar day".($calendarDays === 1 ? '' : 's').').'.($req->reason ? " Handover: {$req->reason}" : ''),
                        'icon' => 'calendar',
                        'color' => 'amber',
                        'priority' => null,
                        'task_id' => null,
                        'task_title' => null,
                        'task' => null,
                        'project_name' => null,
                        'epic_name' => null,
                        'epic_color' => null,
                        'days_until_deadline' => null,
                        'leave_request' => [
                            'id' => $req->id,
                            'user_id' => $req->user_id,
                            'user_name' => $reqUser ? $reqUser->name : 'Studio Member',
                            'user_email' => $reqUser ? $reqUser->email : '',
                            'avatar' => $reqUser ? $reqUser->avatar : null,
                            'position' => $reqPos,
                            'requester_role' => $req->requester_role,
                            'leave_start_date' => $start ? $start->format('Y-m-d') : null,
                            'leave_end_date' => $end ? $end->format('Y-m-d') : null,
                            'leave_start_formatted' => $start ? $start->format('M d, Y') : '',
                            'leave_end_formatted' => $end ? $end->format('M d, Y') : '',
                            'calendar_days' => $calendarDays,
                            'reason' => $req->reason,
                            'created_at' => $req->created_at ? $req->created_at->diffForHumans() : 'Recently',
                            'active_tasks_count' => $assignedTasks->count(),
                            'conflicting_tasks' => $conflicts->map(fn ($t) => [
                                'id' => $t->id,
                                'title' => $t->title,
                                'status' => $t->status,
                                'priority' => $t->priority,
                                'due_date' => $t->hard_constraint_date ? Carbon::parse($t->hard_constraint_date)->format('M d, Y') : 'No deadline',
                            ])->all(),
                        ],
                        'read' => in_array($notifId, $readNotificationIds),
                        'created_at_human' => $req->created_at ? $req->created_at->diffForHumans() : 'Pending',
                    ];
                })->all();

                $notifications = array_merge($leaveNotifications, $notifications);
            }
        } catch (\Exception $e) {
        }

        $teamMembers = [];
        try {
            if ($studio) {
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

        try {
            $messageNotifications = $this->getMessageNotifications($user, $readNotificationIds);
            $notifications = array_merge($notifications, $messageNotifications);

            // Sort notifications: unread first, then preserve recent order
            usort($notifications, function ($a, $b) {
                $aRead = ! empty($a['read']);
                $bRead = ! empty($b['read']);
                if (! $aRead && $bRead) {
                    return -1;
                }
                if ($aRead && ! $bRead) {
                    return 1;
                }

                return 0;
            });
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
     * Build notifications for incoming direct messages and channel messages / mentions.
     *
     * @param  array<int, string>  $readNotificationIds
     * @return array<int, array<string, mixed>>
     */
    public function getMessageNotifications(User $user, array $readNotificationIds = []): array
    {
        $notifications = [];

        try {
            if (! Schema::hasTable('channel_messages')) {
                return [];
            }

            if (empty($readNotificationIds) && Schema::hasTable('notification_reads')) {
                $readNotificationIds = NotificationRead::where('user_id', $user->id)->pluck('notification_id')->all();
            }

            $userReads = collect();
            if (Schema::hasTable('channel_reads')) {
                $userReads = ChannelRead::where('user_id', $user->id)->get()->keyBy('channel_id');
            }

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

                $notifId = 'msg-'.$dm->id;
                $isRead = $isRead || in_array($notifId, $readNotificationIds);

                $notifications[] = [
                    'id' => $notifId,
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

                $notifId = ($isMention ? 'mention-' : 'channel-').$chMsg->id;
                $isRead = $isRead || in_array($notifId, $readNotificationIds);

                $notifications[] = [
                    'id' => $notifId,
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
        }

        return $notifications;
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $counts = HandleInertiaRequests::getInboxUnreadCounts($request->user());

        return response()->json($counts);
    }

    public function markAllNotificationsRead(Request $request): JsonResponse|RedirectResponse
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

        if (Schema::hasTable('notification_reads')) {
            $notifIds = [];

            $tasksQuery = Task::where('assigned_user_id', $user->id)
                ->orWhere('reviewer_user_id', $user->id);

            if (Schema::hasTable('assignments')) {
                $tasksQuery->orWhereIn('id', function ($sub) use ($user) {
                    $sub->select('task_id')
                        ->from('assignments')
                        ->where('employee_user_id', $user->id)
                        ->where('status', 'active');
                });
            }
            $tasks = $tasksQuery->get();

            foreach ($tasks as $t) {
                $notifIds[] = "task-{$t->id}-review_request";
                $notifIds[] = "task-{$t->id}-task_assigned";
                $notifIds[] = "task-{$t->id}-overdue";
                $notifIds[] = "task-{$t->id}-stuck";
            }
            $notifIds[] = 'estimates-pending';

            if (Schema::hasTable('leave_requests')) {
                $leaveReqs = LeaveRequest::where('studio_id', tenant('id'))->where('status', 'pending')->pluck('id');
                foreach ($leaveReqs as $lId) {
                    $notifIds[] = "leave-req-{$lId}";
                }
            }

            if (Schema::hasTable('channel_messages')) {
                $recentMsgs = ChannelMessage::where('created_at', '>=', now()->subDays(14))->limit(100)->get();
                foreach ($recentMsgs as $m) {
                    $notifIds[] = "msg-{$m->id}";
                    $notifIds[] = "channel-{$m->id}";
                    $notifIds[] = "mention-{$m->id}";
                }
            }

            $now = now();
            $records = array_map(fn ($nid) => [
                'user_id' => $user->id,
                'notification_id' => $nid,
                'read_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ], array_unique($notifIds));

            if (! empty($records)) {
                NotificationRead::upsert(
                    $records,
                    ['user_id', 'notification_id'],
                    ['read_at', 'updated_at']
                );
            }
        }

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json(['success' => true]);
    }

    public function markNotificationRead(Request $request, string $tenant, ?string $id = null): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $targetId = $id ?? $tenant;

        if (str_starts_with($targetId, 'msg-') || str_starts_with($targetId, 'channel-') || str_starts_with($targetId, 'mention-')) {
            $msgId = (int) preg_replace('/^[a-z]+-/', '', $targetId);
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

        if (Schema::hasTable('notification_reads')) {
            NotificationRead::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'notification_id' => $targetId,
                ],
                [
                    'read_at' => now(),
                ]
            );
        }

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json(['success' => true]);
    }

    public function markNotificationUnread(Request $request, string $tenant, ?string $id = null): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $targetId = $id ?? $tenant;

        if (Schema::hasTable('notification_reads')) {
            NotificationRead::where('user_id', $user->id)
                ->where('notification_id', $targetId)
                ->delete();
        }

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->json(['success' => true]);
    }
}
