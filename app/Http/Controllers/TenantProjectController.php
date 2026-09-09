<?php

namespace App\Http\Controllers;

use App\Jobs\RecomputeProjectSchedule;
use App\Models\Position;
use App\Models\Skill;
use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TenantProjectController extends Controller
{
    private function authorizeManager()
    {
        $user = auth()->user();
        if ($user && $user->role === \App\Models\User::ROLE_ADMIN) {
            return;
        }

        $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', $user->id)
            ->first();

        $role = $member ? $member->role : 'member';

        if (!in_array($role, ['owner', 'leader', 'manager'])) {
            abort(403, 'Unauthorized action. Only studio managers can perform this task.');
        }
    }

    /**
     * Display the Studio Projects listing page.
     */
    public function index()
    {
        $studio = Studio::find(tenant('id'));
        $membersCount = $studio ? $studio->users()->count() : 0;

        $projects = Project::withCount(['projectMembers as members_count', 'tasks'])
            ->latest()
            ->get()
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'members_count' => $project->members_count,
                'tasks_count' => $project->tasks_count,
            ])
            ->all();

        return Inertia::render('Tenant/Projects/Index', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Pixel Play Studio',
                'members_count' => $membersCount,
            ],
            'projects' => $projects,
        ]);
    }

    /**
     * Display the specified project workspace landing page.
     */
    public function show($project, $routeProject = null)
    {
        $project = $routeProject ?? $project;
        $studio = Studio::find(tenant('id'));

        $projectModel = Project::with(['tasks.assignee', 'tasks.predecessors'])->findOrFail($project);

        $teamMembers = $studio ? $studio->users()->get()->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]) : [];
        $membersById = collect($teamMembers)->keyBy('id');

        // Users live in the central database while assignments live in the
        // tenant database, so this cannot be an Eloquent join relationship.
        // Assemble the named assignee list in two safe, connection-local queries.
        $assignmentIdsByTask = Schema::hasTable('assignments')
            ? DB::table('assignments')
                ->whereIn('task_id', $projectModel->tasks->pluck('id'))
                ->where('status', 'active')
                ->orderBy('assigned_at')
                ->get(['task_id', 'employee_user_id'])
                ->groupBy('task_id')
            : collect();

        $projectModel->tasks->each(function (Task $task) use ($assignmentIdsByTask, $membersById): void {
            $task->setAttribute('assignees', collect($assignmentIdsByTask->get($task->id, []))
                ->map(fn ($assignment) => $membersById->get($assignment->employee_user_id))
                ->filter()
                ->values()
                ->all());
        });

        $skills = Skill::orderBy('name')->get(['id', 'name', 'category'])->all();
        $positions = Position::orderBy('name')->get(['id', 'name'])->all();

        return Inertia::render('Tenant/Projects/Show', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'teamMembers' => $teamMembers,
            'project' => [
                'id' => $projectModel->id,
                'name' => $projectModel->name,
                'description' => $projectModel->description,
                'status' => $projectModel->status,
                'start_date' => $projectModel->start_date?->format('Y-m-d'),
                'target_end_date' => $projectModel->target_end_date?->format('Y-m-d'),
                'tasks' => $projectModel->tasks,
            ],
            'skills' => $skills,
            'positions' => $positions,
        ]);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'target_end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => 'planning',
            'start_date' => $validated['start_date'] ?? now()->toDateString(),
            'target_end_date' => $validated['target_end_date'] ?? null,
        ]);

        if ($request->expectsJson()) {
            return response()->json(['status' => 'success', 'project' => $project], 201);
        }

        return redirect()->back();
    }

    /**
     * Update an existing project (settings, dates).
     */
    public function update(Request $request, $project, $routeProject = null)
    {
        $project = $routeProject ?? $project;
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'target_end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $projectModel = Project::findOrFail($project);
        $projectModel->update($validated);

        RecomputeProjectSchedule::dispatchSync($projectModel->id);

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json(['status' => 'success', 'project' => $projectModel]);
        }

        return redirect()->back()->with('success', 'Project settings updated. Timeline recalculating.');
    }

    /**
     * Store a bulk list of tasks (e.g. from an AI Sprint Decomposition).
     */
    public function storeBulkTasks(Request $request, $project, $routeProject = null)
    {
        $this->authorizeManager();
        $project = $routeProject ?? $project;
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.title' => 'required|string|max:255',
            'tasks.*.objective' => 'nullable|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.estimated_hours' => 'nullable|numeric',
            'tasks.*.days_until_deadline' => 'nullable|integer|min:0',
            'tasks.*.hard_constraint_date' => 'nullable|date',
            'tasks.*.task_classification' => 'nullable|string',
            'tasks.*.task_difficulty' => 'nullable|string',
            'tasks.*.priority' => 'nullable|string',
            'tasks.*.required_skills' => 'nullable|array',
            'tasks.*.depends_on' => 'nullable|array',
            'tasks.*.suggested_depends_on' => 'nullable|array',
            'tasks.*.minimum_experience_years' => 'nullable|numeric',
            'tasks.*.macro_domains' => 'nullable|array',
            'tasks.*.required_position' => 'nullable|string',
            'tasks.*.assigned_user_ids' => 'nullable|array',
            'tasks.*.assigned_user_ids.*' => 'integer',
        ]);

        $projectModel = Project::findOrFail($project);

        $idMapping = []; // map AI temp IDs and 0-based array indices to real DB IDs
        $allTasksArray = array_values($validated['tasks']);

        foreach ($allTasksArray as $index => $taskData) {
            $hours = isset($taskData['estimated_hours']) ? (float) $taskData['estimated_hours'] : 0.0;
            $points = 1;
            if ($hours <= 4) {
                $points = 1;
            } elseif ($hours <= 8) {
                $points = 2;
            } elseif ($hours <= 16) {
                $points = 3;
            } elseif ($hours <= 32) {
                $points = 5;
            } elseif ($hours <= 64) {
                $points = 8;
            } else {
                $points = 13;
            }

            $task = $projectModel->tasks()->create([
                'title' => $taskData['title'],
                'description' => $taskData['objective'] ?? $taskData['description'] ?? null,
                'task_classification' => $taskData['task_classification'] ?? 'Feature',
                'task_difficulty' => $taskData['task_difficulty'] ?? 'Medium',
                'priority' => $taskData['priority'] ?? 'Medium',
                'estimated_hours' => $hours,
                'days_until_deadline' => $taskData['days_until_deadline'] ?? null,
                'hard_constraint_date' => $taskData['hard_constraint_date'] ?? null,
                'minimum_experience_years' => isset($taskData['minimum_experience_years']) ? (float) $taskData['minimum_experience_years'] : 0.0,
                'target_macro_domains' => $taskData['macro_domains'] ?? null,
                'required_position' => $taskData['required_position'] ?? null,
                'required_skills' => $taskData['required_skills'] ?? [],
                'story_points_ai_suggested' => $hours > 0 ? $points : null,
                'expected_estimators' => !empty($taskData['assigned_user_ids']) ? $taskData['assigned_user_ids'] : null,
                'status' => 'todo',
            ]);

            if (isset($taskData['id'])) {
                $idMapping[$taskData['id']] = $task->id;
            }
            $idMapping[$index] = $task->id;
        }

        // Now save dependencies if any
        foreach ($allTasksArray as $index => $taskData) {
            $realTaskId = $idMapping[$taskData['id'] ?? $index] ?? null;
            if ($realTaskId) {
                $realTask = Task::find($realTaskId);
                $realDependsOnIds = [];

                if (! empty($taskData['depends_on'])) {
                    foreach ($taskData['depends_on'] as $tempDepId) {
                        if (isset($idMapping[$tempDepId])) {
                            $realDependsOnIds[] = $idMapping[$tempDepId];
                        }
                    }
                }

                if (! empty($taskData['suggested_depends_on'])) {
                    foreach ($taskData['suggested_depends_on'] as $depIndex) {
                        if (isset($allTasksArray[$depIndex])) {
                            $depTaskData = $allTasksArray[$depIndex];
                            $depRealId = $idMapping[$depTaskData['id'] ?? $depIndex] ?? $idMapping[$depIndex] ?? null;
                            if ($depRealId && $depRealId !== $realTaskId) {
                                $realDependsOnIds[] = $depRealId;
                            }
                        }
                    }
                }

                if (! empty($realDependsOnIds)) {
                    $realTask->predecessors()->syncWithoutDetaching(array_unique($realDependsOnIds));
                }

                // Create assignments for any inline-assigned users from the sprint planning review
                $assignedUserIds = $allTasksArray[$index]['assigned_user_ids'] ?? [];
                if (! empty($assignedUserIds)) {
                    $now = now();
                    $primaryId = $assignedUserIds[0] ?? null;
                    foreach ($assignedUserIds as $userId) {
                        DB::table('assignments')->insert([
                            'task_id' => $realTaskId,
                            'employee_user_id' => $userId,
                            'match_fit_score' => null,
                            'assigned_by' => 'gnn',
                            'match_source' => 'gnn',
                            'status' => 'active',
                            'assigned_at' => $now,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                    if ($primaryId) {
                        $realTask->update(['assigned_user_id' => $primaryId]);
                    }
                }
            }
        }

        RecomputeProjectSchedule::dispatchSync($projectModel->id);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Tasks saved successfully. The timeline is being recalculated.',
                'project_id' => $projectModel->id,
            ]);
        }

        return redirect()->back()->with('success', 'Tasks saved successfully. The timeline is being recalculated.');
    }

    /**
     * Store a single manually-created task.
     */
    public function storeTask(Request $request, $project, $routeProject = null)
    {
        $this->authorizeManager();
        $project = $routeProject ?? $project;
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_user_id' => 'nullable|integer',
            'estimated_hours' => 'required|numeric|min:0',
            'hard_constraint_date' => 'nullable|date',
            'priority' => 'required|string|in:Low,Medium,High,Critical',
            'status' => 'required|string|in:todo,in_progress,review,completed',
            'depends_on' => 'nullable|array',
            'depends_on.*' => 'integer',
            'task_classification' => 'nullable|string|max:255',
            'required_position' => 'nullable|string|max:255',
            'minimum_experience_years' => 'nullable|numeric|min:0',
            'task_difficulty' => 'nullable|string|in:Easy,Medium,Hard',
            'target_macro_domains' => 'nullable|array',
            'target_macro_domains.*' => 'integer',
            'required_skills' => 'nullable|array',
        ]);

        $projectModel = Project::findOrFail($project);

        $task = DB::transaction(function () use ($projectModel, $validated): Task {
            $task = $projectModel->tasks()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'assigned_user_id' => $validated['assigned_user_id'] ?? null,
                'estimated_hours' => $validated['estimated_hours'],
                'hard_constraint_date' => $validated['hard_constraint_date'] ?? null,
                'priority' => $validated['priority'],
                'status' => $validated['status'],
                'task_classification' => $validated['task_classification'] ?? 'Engineering',
                'required_position' => $validated['required_position'] ?? null,
                'minimum_experience_years' => (float) ($validated['minimum_experience_years'] ?? 0.0),
                'task_difficulty' => $validated['task_difficulty'] ?? 'Medium',
                'target_macro_domains' => $validated['target_macro_domains'] ?? [0, 0, 0, 0, 0, 0, 0, 0],
                'required_skills' => $validated['required_skills'] ?? [],
            ]);

            $this->syncTaskDependencies($task, $validated['depends_on'] ?? []);

            if (!empty($validated['assigned_user_id'])) {
                DB::table('assignments')->insert([
                    'task_id' => $task->id,
                    'employee_user_id' => $validated['assigned_user_id'],
                    'match_fit_score' => null,
                    'assigned_by' => 'manual',
                    'match_source' => 'manual',
                    'status' => 'active',
                    'assigned_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $task;
        });

        RecomputeProjectSchedule::dispatchSync($projectModel->id);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'status' => 'success',
                'task' => $task,
            ]);
        }

        return redirect()->back()->with('success', "Task '{$task->title}' created. The timeline is being recalculated.");
    }

    /**
     * Update a task and recalculate the schedule once the change is persisted.
     */
    public function updateTask(Request $request, $project, $task, $routeTask = null)
    {
        if ($routeTask !== null) {
            $project = $task;
            $task = $routeTask;
        }
        $projectModel = Project::findOrFail($project);
        $taskModel = Task::findOrFail($task);

        abort_unless($taskModel->project_id === $projectModel->id, 404);

        $user = auth()->user();
        $isManager = false;
        if ($user && $user->role === \App\Models\User::ROLE_ADMIN) {
            $isManager = true;
        } else {
            $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
                ->where('studio_id', tenant('id'))
                ->where('user_id', $user->id)
                ->first();
            $role = $member ? $member->role : 'member';
            $isManager = in_array($role, ['owner', 'leader', 'manager']);
        }

        if (!$isManager) {
            // Check if they tried to update any field other than 'status'
            $modifiedFields = array_keys($request->except(['status', '_method', '_token']));
            if (!empty($modifiedFields)) {
                abort(403, 'Unauthorized. Members can only update task status.');
            }

            // Ensure task is assigned to them
            if ((int) $taskModel->assigned_user_id !== (int) $user->id) {
                abort(403, 'Unauthorized. You can only update tasks assigned to you.');
            }

            $validated = $request->validate([
                'status' => 'required|string|in:todo,in_progress,review,completed',
            ]);
        } else {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'assigned_user_id' => 'nullable|integer',
                'estimated_hours' => 'sometimes|required|numeric|min:0',
                'hard_constraint_date' => 'nullable|date',
                'priority' => 'sometimes|required|string|in:Low,Medium,High,Critical',
                'status' => 'sometimes|required|string|in:todo,in_progress,review,completed',
                'depends_on' => 'sometimes|array',
                'depends_on.*' => 'integer',
                'task_classification' => 'nullable|string|max:255',
                'required_position' => 'nullable|string|max:255',
                'minimum_experience_years' => 'nullable|numeric|min:0',
                'task_difficulty' => 'nullable|string|in:Easy,Medium,Hard',
                'target_macro_domains' => 'nullable|array',
                'target_macro_domains.*' => 'integer',
                'required_skills' => 'nullable|array',
            ]);
        }

        $oldAssignedId = $taskModel->assigned_user_id;

        DB::transaction(function () use ($taskModel, $validated, $oldAssignedId): void {
            $taskModel->update(collect($validated)->except('depends_on')->all());

            if (array_key_exists('depends_on', $validated)) {
                $this->syncTaskDependencies($taskModel, $validated['depends_on']);
            }

            if (array_key_exists('assigned_user_id', $validated) && (int) $validated['assigned_user_id'] !== (int) $oldAssignedId) {
                DB::table('assignments')->where('task_id', $taskModel->id)->where('status', 'active')->update(['status' => 'cancelled']);
                if ($validated['assigned_user_id']) {
                    DB::table('assignments')->insert([
                        'task_id' => $taskModel->id,
                        'employee_user_id' => $validated['assigned_user_id'],
                        'match_fit_score' => null,
                        'assigned_by' => 'manual',
                        'match_source' => 'manual',
                        'status' => 'active',
                        'assigned_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        RecomputeProjectSchedule::dispatchSync($projectModel->id);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'status' => 'success',
                'task' => $taskModel,
            ]);
        }

        return redirect()->back()->with('success', 'Task updated. The timeline is being recalculated.');
    }

    /**
     * @param  array<int, int>  $dependencyIds
     */
    private function syncTaskDependencies(Task $task, array $dependencyIds): void
    {
        $validIds = Task::query()
            ->where('project_id', $task->project_id)
            ->whereKeyNot($task->id)
            ->whereIn('id', $dependencyIds)
            ->pluck('id')
            ->all();

        $task->predecessors()->sync($validIds);
    }

    /**
     * Store a manually created sprint.
     */
    public function storeSprint(Request $request, $project, $routeProject = null)
    {
        $this->authorizeManager();
        $project = $routeProject ?? $project;
        $projectModel = Project::findOrFail($project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'goal' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'required|string|in:planned,active,completed',
        ]);

        // Validate unique name within project
        $exists = Sprint::where('project_id', $projectModel->id)
            ->where('name', $validated['name'])
            ->exists();
            
        if ($exists) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => ['name' => ['A sprint with this name already exists in this project.']]
            ], 422);
        }

        if ($validated['status'] === 'active') {
            // Only one active sprint allowed at a time, complete others
            Sprint::where('project_id', $projectModel->id)
                ->where('status', 'active')
                ->update(['status' => 'completed']);
        }

        $sprint = $projectModel->sprints()->create($validated);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'status' => 'success',
                'sprint' => $sprint,
            ]);
        }

        return redirect()->back()->with('success', 'Sprint created successfully.');
    }
}
