<?php

namespace App\Http\Controllers;

use App\Jobs\RecomputeProjectSchedule;
use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TenantProjectController extends Controller
{
    /**
     * Display the Studio Projects listing page.
     */
    public function index()
    {
        $studio = Studio::find(tenant('id'));

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
                'tasks' => $projectModel->tasks,
            ],
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
        ]);

        Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => 'planning',
            'start_date' => now()->toDateString(),
        ]);

        return redirect()->back();
    }

    /**
     * Store a bulk list of tasks (e.g. from an AI Sprint Decomposition).
     */
    public function storeBulkTasks(Request $request, $project, $routeProject = null)
    {
        $project = $routeProject ?? $project;
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.title' => 'required|string|max:255',
            'tasks.*.objective' => 'nullable|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.estimated_hours' => 'nullable|numeric',
            'tasks.*.days_until_deadline' => 'nullable|integer|min:0',
            'tasks.*.task_classification' => 'nullable|string',
            'tasks.*.task_difficulty' => 'nullable|string',
            'tasks.*.priority' => 'nullable|string',
            'tasks.*.required_skills' => 'nullable|array',
            'tasks.*.depends_on' => 'nullable|array',
            'tasks.*.suggested_depends_on' => 'nullable|array',
            'tasks.*.minimum_experience_years' => 'nullable|numeric',
            'tasks.*.macro_domains' => 'nullable|array',
            'tasks.*.required_position' => 'nullable|string',
        ]);

        $projectModel = Project::findOrFail($project);

        $idMapping = []; // map AI temp IDs to real DB IDs

        foreach ($validated['tasks'] as $taskData) {
            $task = $projectModel->tasks()->create([
                'title' => $taskData['title'],
                'description' => $taskData['objective'] ?? $taskData['description'] ?? null,
                'task_classification' => $taskData['task_classification'] ?? 'Feature',
                'task_difficulty' => $taskData['task_difficulty'] ?? 'Medium',
                'priority' => $taskData['priority'] ?? 'Medium',
                'estimated_hours' => isset($taskData['estimated_hours']) ? (float) $taskData['estimated_hours'] : 0.0,
                'days_until_deadline' => $taskData['days_until_deadline'] ?? null,
                'minimum_experience_years' => isset($taskData['minimum_experience_years']) ? (float) $taskData['minimum_experience_years'] : 0.0,
                'target_macro_domains' => $taskData['macro_domains'] ?? null,
                'required_position' => $taskData['required_position'] ?? null,
                'required_skills' => $taskData['required_skills'] ?? [],
                'status' => 'todo',
            ]);

            if (isset($taskData['id'])) {
                $idMapping[$taskData['id']] = $task->id;
            }
        }

        // Now save dependencies if any
        foreach ($validated['tasks'] as $taskData) {
            if (! empty($taskData['depends_on']) && isset($taskData['id'])) {
                $realTaskId = $idMapping[$taskData['id']] ?? null;
                if ($realTaskId) {
                    $realTask = Task::find($realTaskId);

                    $realDependsOnIds = [];
                    foreach ($taskData['depends_on'] as $tempDepId) {
                        if (isset($idMapping[$tempDepId])) {
                            $realDependsOnIds[] = $idMapping[$tempDepId];
                        }
                    }

                    if (! empty($realDependsOnIds)) {
                        $realTask->predecessors()->syncWithoutDetaching($realDependsOnIds);
                    }
                }
            }
        }

        RecomputeProjectSchedule::dispatch($projectModel->id);

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
        $project = $routeProject ?? $project;
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_user_id' => 'nullable|integer',
            'estimated_hours' => 'required|numeric|min:0',
            'priority' => 'required|string|in:Low,Medium,High,Critical',
            'status' => 'required|string|in:todo,in_progress,review,completed',
            'depends_on' => 'nullable|array',
            'depends_on.*' => 'integer',
        ]);

        $projectModel = Project::findOrFail($project);

        $task = DB::transaction(function () use ($projectModel, $validated): Task {
            $task = $projectModel->tasks()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'assigned_user_id' => $validated['assigned_user_id'] ?? null,
                'estimated_hours' => $validated['estimated_hours'],
                'priority' => $validated['priority'],
                'status' => $validated['status'],
            ]);

            $this->syncTaskDependencies($task, $validated['depends_on'] ?? []);

            return $task;
        });

        RecomputeProjectSchedule::dispatch($projectModel->id);

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

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assigned_user_id' => 'nullable|integer',
            'estimated_hours' => 'sometimes|required|numeric|min:0',
            'priority' => 'sometimes|required|string|in:Low,Medium,High,Critical',
            'status' => 'sometimes|required|string|in:todo,in_progress,review,completed',
            'depends_on' => 'sometimes|array',
            'depends_on.*' => 'integer',
        ]);

        DB::transaction(function () use ($taskModel, $validated): void {
            $taskModel->update(collect($validated)->except('depends_on')->all());

            if (array_key_exists('depends_on', $validated)) {
                $this->syncTaskDependencies($taskModel, $validated['depends_on']);
            }
        });

        RecomputeProjectSchedule::dispatch($projectModel->id);

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
}
