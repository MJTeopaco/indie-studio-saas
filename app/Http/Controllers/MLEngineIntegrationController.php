<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Services\MLEngineService;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MLEngineIntegrationController extends Controller
{
    protected MLEngineService $mlService;

    public function __construct(MLEngineService $mlService)
    {
        $this->mlService = $mlService;
    }

    /**
     * Ask the ML engine to decompose a project description into tasks.
     * The React frontend will display these before saving.
     *
     * DESIGN CONSTRAINT: "decision-support, not directive"
     * Do NOT automatically create Task/TaskDependency records here.
     * Return the raw ML-engine JSON as an editable draft/preview.
     * Only persist to the database when the manager explicitly confirms via the UI.
     */
    public function decomposeSprint(Request $request, $project, $routeProject = null)
    {
        // LLM generation can take several minutes on local CPU
        set_time_limit(0);
        $validated = $request->validate([
            'description' => 'required|string',
        ]);

        $response = $this->mlService->decomposeProject($validated['description']);

        return response()->json($response);
    }

    /**
     * Recompute the CPA schedule for a given project and bulk update the tasks.
     */
    public function computeSchedule(Request $request, $project, $routeProject = null)
    {
        $project = $routeProject ?? $project;

        return response()->json($this->mlService->recomputeProjectSchedule(Project::findOrFail($project)));
    }

    /**
     * Get best-fit developer candidates for a specific task using the GNN,
     * and synthesize a plain-language explanation using the LLM.
     */
    public function bestFit(Request $request, $task, $routeTask = null)
    {
        $task = $routeTask ?? $task;
        $task = Task::findOrFail($task);
        // LLM generation for explanations can take several minutes on local CPU
        set_time_limit(0);
        $payload = $task->toGNNFeatureDict();
        $response = $this->mlService->getBestFit($payload);

        if ($response['status'] === 'success' && ! empty($response['results'])) {
            // Grab the CPA schedule (if any) to ground the LLM
            $cpaSchedule = null;
            if ($task->es !== null && $task->is_critical !== null) {
                $cpaSchedule = [
                    'es' => $task->es,
                    'ef' => $task->ef,
                    'ls' => $task->ls,
                    'lf' => $task->lf,
                    'total_float' => $task->total_float,
                    'is_critical' => $task->is_critical,
                ];
            }

            // Synthesize the explanation
            $synthesis = $this->mlService->synthesizeAssignment($response['results'], $cpaSchedule);
            if ($synthesis['status'] === 'success') {
                $response['explanation'] = $synthesis['explanation'];
            }
        }

        return response()->json($response);
    }

    /**
     * Assign a team member to a task.
     * Creates an assignments record and updates the task's assignee_user_id.
     */
    public function assignTask(Request $request, $task, $routeTask = null)
    {
        $task = $routeTask ?? $task;
        $task = Task::findOrFail($task);
        $validated = $request->validate([
            'employee_user_id' => 'required|integer|exists:users,id',
            'match_fit_score' => 'nullable|numeric|min:0|max:1',
            'assigned_by' => 'nullable|string|in:gnn,cold_start_baseline,manual',
        ]);

        $assignee = User::findOrFail($validated['employee_user_id']);

        DB::transaction(function () use ($task, $validated): void {
            DB::table('assignments')->where('task_id', $task->id)->where('status', 'active')->update(['status' => 'cancelled']);

            DB::table('assignments')->insert([
                'task_id' => $task->id,
                'employee_user_id' => $validated['employee_user_id'],
                'match_fit_score' => $validated['match_fit_score'] ?? null,
                'assigned_by' => $validated['assigned_by'] ?? 'gnn',
                'match_source' => $validated['assigned_by'] ?? 'gnn',
                'status' => 'active',
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $task->update(['assigned_user_id' => $validated['employee_user_id']]);
        });

        return response()->json([
            'status' => 'success',
            'task_id' => $task->id,
            'assignee' => $assignee->only(['id', 'name']),
        ]);
    }

    /**
     * Answer project questions and provide the project intelligence cards.
     */
    public function projectAssistant(Request $request, $project, $routeProject = null)
    {
        $project = $routeProject ?? $project;
        $validated = $request->validate([
            'message' => 'required|string|max:3000',
            'mode' => 'nullable|string|in:chat,risk,summary,deadline',
            'history' => 'nullable|array|max:10',
            'history.*.role' => 'required_with:history|string|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:3000',
        ]);

        $projectModel = Project::with(['tasks.assignee', 'tasks.predecessors'])->findOrFail($project);
        $tasks = $projectModel->tasks;
        $taskData = $tasks->map(fn (Task $task): array => [
            'id' => $task->id,
            'title' => $task->title,
            'status' => $task->status,
            'days_until_deadline' => $task->days_until_deadline,
            'assigned_to' => $task->assignee?->name,
            'estimated_hours' => $task->estimated_hours,
            'difficulty' => $task->task_difficulty,
            'depends_on' => $task->predecessors->pluck('id')->all(),
            'is_critical' => (bool) $task->is_critical,
        ])->all();
        $assignments = DB::table('assignments')->whereIn('task_id', $tasks->pluck('id'))->get()->map(fn ($assignment): array => (array) $assignment)->all();
        $completed = $tasks->where('status', 'completed')->count();
        $active = $tasks->whereIn('status', ['todo', 'in_progress', 'review']);
        $remainingHours = (float) $active->sum('estimated_hours');
        $capacityPerDay = max(1, $tasks->pluck('assigned_user_id')->filter()->unique()->count()) * 8;
        $predictedDate = Carbon::today()->addDays((int) ceil($remainingHours / $capacityPerDay))->toDateString();
        $stats = [
            'project_name' => $projectModel->name,
            'total_tasks' => $tasks->count(),
            'completed' => $completed,
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'overdue' => $active->filter(fn (Task $task): bool => $task->days_until_deadline !== null && $task->days_until_deadline <= 0)->count(),
            'estimated_completion_date' => $predictedDate,
            'velocity_tasks_per_day' => round($capacityPerDay / max(1, $active->avg('estimated_hours') ?: 1), 1),
        ];
        $context = ['project' => $projectModel->only(['id', 'name', 'status', 'target_end_date']), 'tasks' => $taskData, 'stats' => $stats];
        $mode = $validated['mode'] ?? 'chat';

        if ($mode === 'risk') {
            $result = $this->mlService->scanProjectRisks([
                'tasks' => $taskData,
                'assignments' => $assignments,
                'critical_path_task_ids' => $tasks->filter(fn (Task $task): bool => (bool) $task->is_critical)->pluck('id')->all(),
            ]);

            return response()->json(['status' => $result['status'], 'reply' => $result['explanation'] ?? 'No risks found.', 'data' => $result]);
        }

        if ($mode === 'summary') {
            $result = $this->mlService->summarizeProject($stats);

            return response()->json(['status' => $result['status'], 'reply' => $result['summary'] ?? 'Summary unavailable.', 'data' => $result]);
        }

        if ($mode === 'deadline') {
            return response()->json(['status' => 'success', 'reply' => "Based on {$remainingHours} remaining estimated hours and the current assigned-team capacity, {$projectModel->name} is projected to finish around {$predictedDate}.", 'data' => ['predicted_date' => $predictedDate]]);
        }

        $result = $this->mlService->chatAboutProject($validated['message'], $context, $validated['history'] ?? []);

        return response()->json(['status' => $result['status'], 'reply' => $result['reply'] ?? 'I could not answer that right now.']);
    }
}
