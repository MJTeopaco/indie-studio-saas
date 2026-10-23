<?php

namespace App\Http\Controllers;

use App\Events\TaskStatusUpdated;
use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TenantTaskController extends Controller
{
    public function index(Request $request)
    {
        $studio = Studio::find(tenant('id'));
        $user = auth()->user();

        $isManager = false;
        if ($user && $user->role === User::ROLE_ADMIN) {
            $isManager = true;
        } else {
            $member = DB::connection(config('tenancy.database.central_connection', 'central'))
                ->table('studio_members')
                ->where('studio_id', tenant('id'))
                ->where('user_id', $user->id)
                ->first();
            $role = $member ? $member->role : 'member';
            $isManager = in_array($role, ['owner', 'leader', 'manager']);
        }

        if ($isManager) {
            $projects = Project::latest()->get()->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'target_end_date' => $project->target_end_date?->format('Y-m-d'),
            ])->all();
        } else {
            $assignedProjectIds = DB::table('project_members')
                ->where('user_id', $user->id)
                ->pluck('project_id')
                ->merge(
                    Task::where('assigned_user_id', $user->id)
                        ->orWhere('reviewer_user_id', $user->id)
                        ->pluck('project_id')
                );

            if (Schema::hasTable('assignments')) {
                $assignedTaskProjectIds = DB::table('assignments')
                    ->join('tasks', 'assignments.task_id', '=', 'tasks.id')
                    ->where('assignments.employee_user_id', $user->id)
                    ->where('assignments.status', 'active')
                    ->pluck('tasks.project_id');
                $assignedProjectIds = $assignedProjectIds->merge($assignedTaskProjectIds);
            }

            $assignedProjectIds = $assignedProjectIds->unique()->filter()->values();

            $projects = Project::whereIn('id', $assignedProjectIds)
                ->latest()
                ->get()
                ->map(fn (Project $project) => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'start_date' => $project->start_date?->format('Y-m-d'),
                    'target_end_date' => $project->target_end_date?->format('Y-m-d'),
                ])->all();
        }

        $tasks = [];
        foreach ($projects as $project) {
            $query = Task::with(['assignee', 'reviewer', 'sprint:id,name,status', 'epic:id,name,color'])
                ->where('project_id', $project['id']);

            if (! $isManager) {
                $query->where(function ($q) use ($user) {
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
                });
            }

            $projectTasks = $query->get();
            $taskIds = $projectTasks->pluck('id');

            $assignmentsByTask = [];
            if (Schema::hasTable('assignments') && $taskIds->isNotEmpty()) {
                $activeAssignments = DB::table('assignments')
                    ->whereIn('task_id', $taskIds)
                    ->where('status', 'active')
                    ->orderBy('assigned_at')
                    ->get(['task_id', 'employee_user_id']);

                $memberIds = $activeAssignments->pluck('employee_user_id')->unique()->filter();
                $members = DB::connection(config('tenancy.database.central_connection', 'central'))
                    ->table('users')
                    ->whereIn('id', $memberIds)
                    ->get(['id', 'name'])
                    ->keyBy('id');

                foreach ($activeAssignments as $assign) {
                    if (! isset($assignmentsByTask[$assign->task_id])) {
                        $assignmentsByTask[$assign->task_id] = [
                            'user_id' => $assign->employee_user_id,
                            'name' => $members[$assign->employee_user_id]->name ?? null,
                        ];
                    }
                }
            }

            $projectStartDate = $project['start_date'] ?? null;
            $projectCode = $this->deriveProjectCode($project['name']);

            $tasks[$project['id']] = $projectTasks
                ->map(function (Task $task) use ($assignmentsByTask, $project, $projectStartDate, $projectCode) {
                    $fallbackAssignee = $assignmentsByTask[$task->id] ?? null;
                    $assigneeName = $task->assignee ? $task->assignee->name : ($fallbackAssignee['name'] ?? null);
                    $assignedUserId = $task->assigned_user_id ?? ($fallbackAssignee['user_id'] ?? null);

                    $startDate = null;
                    $dueDate = null;

                    if ($projectStartDate && $task->es !== null) {
                        $startDate = $this->deriveWorkingDate($projectStartDate, (float) $task->es);
                    }
                    if ($projectStartDate && $task->ef !== null) {
                        $dueDate = $this->deriveWorkingDate($projectStartDate, (float) $task->ef);
                    }

                    if ($task->hard_constraint_date) {
                        $dueDate = $task->hard_constraint_date->format('Y-m-d');
                    }

                    if (! $startDate) {
                        if ($task->sprint?->start_date) {
                            $startDate = $task->sprint->start_date->format('Y-m-d');
                        } elseif ($task->created_at) {
                            $startDate = $task->created_at->format('Y-m-d');
                        } else {
                            $startDate = now()->format('Y-m-d');
                        }
                    }

                    if (! $dueDate) {
                        if ($task->sprint?->end_date) {
                            $dueDate = $task->sprint->end_date->format('Y-m-d');
                        } elseif ($task->days_until_deadline !== null) {
                            $dueDate = Carbon::parse($startDate)->addDays($task->days_until_deadline)->toDateString();
                        } else {
                            $durationDays = max(1, (int) ceil(($task->estimated_hours ?? 8) / 8));
                            $dueDate = Carbon::parse($startDate)->addDays($durationDays)->toDateString();
                        }
                    }

                    if ($dueDate < $startDate) {
                        $durationDays = max(1, (int) ceil(($task->estimated_hours ?? 8) / 8));
                        $startDate = Carbon::parse($dueDate)->subDays($durationDays)->toDateString();
                    }

                    $taskKey = sprintf('%s-%03d', $projectCode, $task->id);

                    return [
                        'id' => $task->id,
                        'project_id' => $task->project_id,
                        'project_name' => $project['name'],
                        'project_code' => $projectCode,
                        'task_key' => $taskKey,
                        'title' => $task->title,
                        'description' => $task->description,
                        'task_classification' => $task->task_classification,
                        'required_position' => $task->required_position,
                        'task_difficulty' => $task->task_difficulty,
                        'priority' => $task->priority,
                        'estimated_hours' => $task->estimated_hours,
                        'days_until_deadline' => $task->days_until_deadline,
                        'hard_constraint_date' => $task->hard_constraint_date?->format('Y-m-d'),
                        'status' => $task->status,
                        'sprint_status' => $task->sprint_status,
                        'sprint_priority' => $task->sprint_priority,
                        'story_points' => $task->story_points,
                        'story_points_locked' => (bool) $task->story_points_locked,
                        'needs_estimate_review' => (bool) $task->needs_estimate_review,
                        'suggested_story_points' => $task->suggested_story_points,
                        'estimate_review_note' => $task->estimate_review_note,
                        'github_link' => $task->github_link,
                        'is_critical' => (bool) $task->is_critical,
                        'assignee' => $assigneeName,
                        'assigned_user_id' => $assignedUserId,
                        'reviewer' => $task->reviewer ? $task->reviewer->name : null,
                        'reviewer_user_id' => $task->reviewer_user_id,
                        'sprint_id' => $task->sprint_id,
                        'sprint_name' => $task->sprint?->name,
                        'epic_id' => $task->epic_id,
                        'epic_name' => $task->epic?->name,
                        'epic_color' => $task->epic?->color,
                        'es' => $task->es,
                        'ef' => $task->ef,
                        'total_float' => $task->total_float,
                        'dueDate' => $dueDate,
                        'startDate' => $startDate,
                        'created_at' => $task->created_at?->toIso8601String(),
                    ];
                })->all();
        }

        return Inertia::render('Tenant/Tasks/Index', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Pixel Play Studio',
            ],
            'projects' => $projects,
            'tasks' => $tasks,
            'isManager' => $isManager,
        ]);
    }

    /**
     * Update task status with reviewer-gated workflow enforcement.
     *
     * Workflow rules:
     *   - todo → in_progress: anyone assigned (doer) or manager
     *   - in_progress → review: doer only (if reviewer is set)
     *   - in_progress → completed: doer only (if no reviewer is set)
     *   - in_progress → stuck: doer only
     *   - review → completed: reviewer only (or manager)
     *   - review → in_progress: reviewer can send back
     * Managers can move tasks freely regardless of reviewer rules.
     */
    public function updateStatus(Request $request, $task, $routeTask = null)
    {
        if ($routeTask !== null) {
            $task = $routeTask;
        }

        $taskModel = Task::findOrFail($task);
        $user = auth()->user();

        // ── Determine role ──────────────────────────────────────────────────
        $isManager = false;
        if ($user && $user->role === User::ROLE_ADMIN) {
            $isManager = true;
        } else {
            $member = DB::connection(config('tenancy.database.central_connection', 'central'))
                ->table('studio_members')
                ->where('studio_id', tenant('id'))
                ->where('user_id', $user->id)
                ->first();
            $role = $member ? $member->role : 'member';
            $isManager = in_array($role, ['owner', 'leader', 'manager']);
        }

        $isDoer = ((int) $taskModel->assigned_user_id === (int) $user->id) || DB::table('assignments')
            ->where('task_id', $taskModel->id)
            ->where('employee_user_id', $user->id)
            ->where('status', 'active')
            ->exists();

        $isReviewer = (int) $taskModel->reviewer_user_id === (int) $user->id;
        $hasReviewer = ! empty($taskModel->reviewer_user_id);

        if (! $isManager && ! $isDoer && ! $isReviewer) {
            abort(403, 'Unauthorized. You are not assigned to this task.');
        }

        $validated = $request->validate([
            'status' => 'sometimes|required|string|in:todo,in_progress,review,completed,stuck,overdue',
            'sprint_status' => 'sometimes|nullable|string|in:ready_to_start,in_progress,waiting_for_review,done,stuck,overdue',
            'story_points' => 'sometimes|nullable|integer|min:0|max:100',
            'github_link' => 'sometimes|nullable|url|max:500',
        ]);

        // ── Status ↔ sprint_status sync ────────────────────────────────────
        if (isset($validated['sprint_status']) && ! isset($validated['status'])) {
            $map = [
                'ready_to_start' => 'todo',
                'in_progress' => 'in_progress',
                'waiting_for_review' => 'review',
                'done' => 'completed',
                'stuck' => 'stuck',
                'overdue' => 'overdue',
            ];
            if (isset($map[$validated['sprint_status']])) {
                $validated['status'] = $map[$validated['sprint_status']];
            }
        } elseif (isset($validated['status']) && ! isset($validated['sprint_status'])) {
            $map = [
                'todo' => 'ready_to_start',
                'in_progress' => 'in_progress',
                'review' => 'waiting_for_review',
                'completed' => 'done',
                'stuck' => 'stuck',
                'overdue' => 'overdue',
            ];
            if (isset($map[$validated['status']])) {
                $validated['sprint_status'] = $map[$validated['status']];
            }
        }

        $newStatus = $validated['status'] ?? null;

        // ── Enforce reviewer-gated transitions for non-managers ──────────────
        if (! $isManager && $newStatus !== null) {
            $currentStatus = $taskModel->status;

            // Only the reviewer (or manager) can mark "in review" tasks as completed
            if ($currentStatus === 'review' && $newStatus === 'completed' && $hasReviewer && ! $isReviewer) {
                abort(403, 'Only the assigned reviewer can mark this task as done.');
            }

            // Doer cannot directly jump from in_progress to completed when a reviewer exists
            if ($currentStatus === 'in_progress' && $newStatus === 'completed' && $hasReviewer && ! $isReviewer) {
                abort(403, 'This task requires reviewer approval. Move it to "In Review" first.');
            }

        }

        if ($newStatus === 'completed') {
            $validated['completed_at'] = now();
            $validated['completed_by_user_id'] = $user?->id ?? $taskModel->assigned_user_id;
        } elseif ($newStatus !== null && $newStatus !== 'completed' && $taskModel->status === 'completed') {
            $validated['completed_at'] = null;
            $validated['completed_by_user_id'] = null;
        }

        $taskModel->update($validated);

        try {
            $studioId = (string) (tenant('id') ?? $request->route('tenant'));
            broadcast(new TaskStatusUpdated(
                $studioId,
                (int) $taskModel->id,
                (string) ($taskModel->status ?? ''),
                array_merge($taskModel->toArray(), [
                    'reviewer_user_id' => $taskModel->reviewer_user_id,
                ])
            ))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('TaskStatusUpdated broadcast failed: '.$e->getMessage());
        }

        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->ajax())) {
            return response()->json([
                'status' => 'success',
                'task' => array_merge($taskModel->toArray(), [
                    'reviewer_user_id' => $taskModel->reviewer_user_id,
                ]),
            ]);
        }

        return redirect()->back()->with('success', 'Task status updated.');
    }

    /**
     * Derive calendar date from a start date and working hours offset (skipping weekends).
     */
    private function deriveWorkingDate(?string $startDateStr, ?float $hoursOffset): ?string
    {
        if (! $startDateStr || $hoursOffset === null) {
            return null;
        }

        $daysOffset = (int) floor($hoursOffset / 8);
        $date = Carbon::parse($startDateStr);
        $added = 0;

        while ($added < $daysOffset) {
            $date->addDay();
            if (! $date->isWeekend()) {
                $added++;
            }
        }

        return $date->toDateString();
    }

    /**
     * Derive a 2-4 letter uppercase project code from project name.
     */
    private function deriveProjectCode(string $name): string
    {
        $words = preg_split('/[\s\-_]+/', trim($name));
        if (count($words) >= 2) {
            $code = '';
            foreach ($words as $w) {
                if (! empty($w)) {
                    $code .= strtoupper($w[0]);
                }
            }
            if (strlen($code) >= 2 && strlen($code) <= 4) {
                return $code;
            }
        }

        $cleaned = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $name));

        return substr($cleaned, 0, 3) ?: 'PRJ';
    }

    /**
     * Flag task complexity issue (Member / Assignee).
     */
    public function flagComplexity(Request $request, $task, $routeTask = null)
    {
        if ($routeTask !== null) {
            $task = $routeTask;
        }

        $taskModel = $task instanceof Task ? $task : Task::findOrFail($task);
        $user = auth()->user();

        $isManager = false;
        if ($user && $user->role === User::ROLE_ADMIN) {
            $isManager = true;
        } else {
            $centralConn = config('tenancy.database.central_connection', 'central');
            if (Schema::connection($centralConn)->hasTable('studio_members')) {
                $member = DB::connection($centralConn)
                    ->table('studio_members')
                    ->where('studio_id', tenant('id'))
                    ->where('user_id', $user->id)
                    ->first();
                $role = $member ? $member->role : 'member';
                $isManager = in_array($role, ['owner', 'leader', 'manager']);
            }
        }

        $isDoer = ((int) $taskModel->assigned_user_id === (int) $user->id);
        if (Schema::hasTable('assignments')) {
            $isDoer = $isDoer || DB::table('assignments')
                ->where('task_id', $taskModel->id)
                ->where('employee_user_id', $user->id)
                ->where('status', 'active')
                ->exists();
        }

        if (! $isManager && ! $isDoer) {
            abort(403, 'Unauthorized. Only the assigned member or manager can flag complexity for this task.');
        }

        $validated = $request->validate([
            'suggested_story_points' => 'required|integer|in:1,2,3,5,8,13,21,34',
            'feedback' => 'required|string|min:3|max:1000',
        ]);

        $taskModel->update([
            'needs_estimate_review' => true,
            'suggested_story_points' => $validated['suggested_story_points'],
            'estimate_review_note' => $validated['feedback'],
        ]);

        try {
            $studioId = (string) (tenant('id') ?? $request->route('tenant'));
            broadcast(new TaskStatusUpdated(
                $studioId,
                (int) $taskModel->id,
                (string) ($taskModel->status ?? ''),
                $taskModel->toArray()
            ))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('TaskStatusUpdated broadcast failed on flagComplexity: '.$e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Complexity issue flagged successfully. Manager has been notified.',
            'task' => $taskModel->load(['assignee', 'reviewer', 'project', 'epic', 'sprint']),
        ]);
    }

    /**
     * Resolve flagged complexity (Manager).
     */
    public function resolveComplexity(Request $request, $task, $routeTask = null)
    {
        if ($routeTask !== null) {
            $task = $routeTask;
        }

        $taskModel = $task instanceof Task ? $task : Task::findOrFail($task);
        $user = auth()->user();

        $isManager = false;
        if ($user && $user->role === User::ROLE_ADMIN) {
            $isManager = true;
        } else {
            $centralConn = config('tenancy.database.central_connection', 'central');
            if (Schema::connection($centralConn)->hasTable('studio_members')) {
                $member = DB::connection($centralConn)
                    ->table('studio_members')
                    ->where('studio_id', tenant('id'))
                    ->where('user_id', $user->id)
                    ->first();
                $role = $member ? $member->role : 'member';
                $isManager = in_array($role, ['owner', 'leader', 'manager']);
            }
        }

        if (! $isManager) {
            abort(403, 'Unauthorized. Only managers can resolve complexity flags.');
        }

        $validated = $request->validate([
            'action' => 'required|string|in:accept,modify,dismiss',
            'story_points' => 'required_if:action,accept,modify|nullable|integer|in:1,2,3,5,8,13,21,34',
        ]);

        $updates = [
            'needs_estimate_review' => false,
            'suggested_story_points' => null,
        ];

        if (in_array($validated['action'], ['accept', 'modify']) && ! empty($validated['story_points'])) {
            $updates['story_points'] = $validated['story_points'];
            $updates['story_points_locked'] = true;
        }

        $taskModel->update($updates);

        if (in_array($validated['action'], ['accept', 'modify'])) {
            try {
                app(\App\Services\EstimationService::class)->deriveDurationForTask($taskModel);
            } catch (\Throwable $e) {
                Log::warning('EstimationService deriveDurationForTask failed on resolveComplexity: '.$e->getMessage());
            }
        }

        try {
            $studioId = (string) (tenant('id') ?? $request->route('tenant'));
            broadcast(new TaskStatusUpdated(
                $studioId,
                (int) $taskModel->id,
                (string) ($taskModel->status ?? ''),
                $taskModel->toArray()
            ))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('TaskStatusUpdated broadcast failed on resolveComplexity: '.$e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'message' => $validated['action'] === 'dismiss'
                ? 'Complexity flag dismissed.'
                : 'Task Story Points updated successfully.',
            'task' => $taskModel->load(['assignee', 'reviewer', 'project', 'epic', 'sprint']),
        ]);
    }
}
