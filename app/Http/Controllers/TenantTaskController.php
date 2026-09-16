<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $projects = Project::latest()->get()->map(fn (Project $project) => [
            'id' => $project->id,
            'name' => $project->name,
            'status' => $project->status,
        ])->all();

        $tasks = [];
        foreach ($projects as $project) {
            $query = Task::with(['assignee', 'reviewer', 'sprint:id,name,status', 'epic:id,name,color'])
                ->where('project_id', $project['id']);

            if (! $isManager) {
                $query->where(function ($q) use ($user) {
                    $q->where('assigned_user_id', $user->id)
                        ->orWhere('reviewer_user_id', $user->id);
                });
            }

            $tasks[$project['id']] = $query->get()
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'project_id' => $task->project_id,
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
                    'actual_story_points' => $task->actual_story_points,
                    'github_link' => $task->github_link,
                    'is_critical' => (bool) $task->is_critical,
                    'assignee' => $task->assignee ? $task->assignee->name : null,
                    'assigned_user_id' => $task->assigned_user_id,
                    'reviewer' => $task->reviewer ? $task->reviewer->name : null,
                    'reviewer_user_id' => $task->reviewer_user_id,
                    'sprint_id' => $task->sprint_id,
                    'sprint_name' => $task->sprint?->name,
                    'epic_id' => $task->epic_id,
                    'epic_name' => $task->epic?->name,
                    'epic_color' => $task->epic?->color,
                    'dueDate' => $task->hard_constraint_date
                        ? $task->hard_constraint_date->format('Y-m-d')
                        : ($task->days_until_deadline !== null
                            ? now()->addDays($task->days_until_deadline)->toDateString()
                            : null),
                    'startDate' => now()->toDateString(),
                ])->all();
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
            'status' => 'sometimes|required|string|in:todo,in_progress,review,completed,stuck',
            'sprint_status' => 'sometimes|nullable|string|in:ready_to_start,in_progress,waiting_for_review,pending_deploy,done,stuck',
            'actual_story_points' => 'sometimes|nullable|integer|min:0|max:100',
            'github_link' => 'sometimes|nullable|url|max:500',
        ]);

        // ── Status ↔ sprint_status sync ────────────────────────────────────
        if (isset($validated['sprint_status']) && ! isset($validated['status'])) {
            $map = [
                'ready_to_start' => 'todo',
                'in_progress' => 'in_progress',
                'waiting_for_review' => 'review',
                'pending_deploy' => 'review',
                'done' => 'completed',
                'stuck' => 'stuck',
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
            if ($currentStatus === 'review' && $newStatus === 'completed' && ! $isReviewer) {
                abort(403, 'Only the assigned reviewer can mark this task as done.');
            }

            // Doer cannot directly jump from in_progress to completed when a reviewer exists
            if ($currentStatus === 'in_progress' && $newStatus === 'completed' && $hasReviewer && ! $isReviewer) {
                abort(403, 'This task requires reviewer approval. Move it to "In Review" first.');
            }

            // Prevent going back to "todo" from "in_progress" or beyond
            if (in_array($currentStatus, ['in_progress', 'review', 'completed']) && $newStatus === 'todo') {
                abort(422, 'You cannot move a task back to "To Do" once started.');
            }
        }

        $taskModel->update($validated);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'status' => 'success',
                'task' => array_merge($taskModel->toArray(), [
                    'reviewer_user_id' => $taskModel->reviewer_user_id,
                ]),
            ]);
        }

        return redirect()->back()->with('success', 'Task status updated.');
    }
}
