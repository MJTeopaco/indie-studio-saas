<?php

namespace App\Http\Controllers;

use App\Jobs\RecomputeProjectSchedule;
use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use App\Services\MLEngineService;
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

    /** Generate an editable task plan before a new project exists. */
    public function decomposeWorkspaceProject(Request $request)
    {
        set_time_limit(0);
        $validated = $request->validate([
            'description' => 'required|string|max:3000',
        ]);

        return response()->json($this->mlService->decomposeProject($validated['description']));
    }

    /**
     * Handle conversational requests made from the studio workspace. Unlike
     * project planning, this route does not require a project to be selected.
     */
    public function workspaceAssistant(Request $request)
    {
        set_time_limit(0);
        $validated = $request->validate([
            'message' => 'required|string|max:3000',
            'history' => 'nullable|array|max:10',
            'history.*.role' => 'required_with:history|string|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:3000',
        ]);

        $message = trim($validated['message']);
        if (preg_match('/^(hi|hello|hey|helo|good (morning|afternoon|evening))[!,. ]*$/i', $message)) {
            return response()->json([
                'status' => 'success',
                'reply' => 'Hello! I\'m StudioSprint AI. I can answer questions about your workspace, projects, and team. When you\'re ready to plan work, describe the task and select a project.',
            ]);
        }

        // ── Studio members (including the studio owner) ────────────────────
        $studio = Studio::with(['users'])->find(tenant('id'));

        // Collect member IDs from studio_members pivot (owner is also listed here)
        $memberUserIds = $studio?->users?->pluck('id')?->all() ?? [];

        // Count active tasks per member for context richness
        $activeTasksPerMember = Task::query()
            ->whereIn('status', ['todo', 'in_progress', 'review'])
            ->whereIn('assigned_user_id', $memberUserIds)
            ->selectRaw('assigned_user_id, COUNT(*) as active_task_count')
            ->groupBy('assigned_user_id')
            ->pluck('active_task_count', 'assigned_user_id');

        $members = $studio?->users?->map(function ($user) use ($activeTasksPerMember): array {
            $pivotRole = $user->pivot?->role ?? 'member';

            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $pivotRole,
                'is_owner' => $user->role === User::ROLE_ADMIN,
                'active_task_count' => (int) ($activeTasksPerMember[$user->id] ?? 0),
            ];
        })?->values()?->all() ?? [];

        // ── Projects with task counts ──────────────────────────────────────
        $projects = Project::query()
            ->withCount('tasks')
            ->latest()
            ->get(['id', 'name', 'status'])
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'task_count' => $project->tasks_count,
            ])
            ->all();

        // ── All tasks with assignee eager-loaded (capped for LLM context) ─
        $allTasks = Task::query()
            ->with('assignee:id,name')
            ->latest()
            ->take(40)
            ->get(['id', 'title', 'status', 'priority', 'estimated_hours', 'project_id',
                'assigned_user_id', 'days_until_deadline'])
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'title' => $task->title,
                'status' => $task->status,
                'priority' => $task->priority,
                'estimated_hours' => $task->estimated_hours,
                'project_id' => $task->project_id,
                'assigned_to' => $task->assignee?->name,
                'days_until_deadline' => $task->days_until_deadline,
                'is_overdue' => $task->days_until_deadline !== null && $task->days_until_deadline <= 0,
            ])
            ->all();

        // ── Workspace-level aggregate stats (computed over ALL tasks) ──────
        $allTasksForStats = Task::query()
            ->get(['id', 'status', 'days_until_deadline']);

        $byStatus = $allTasksForStats
            ->groupBy('status')
            ->map(fn ($group) => $group->count())
            ->all();

        $overdueStatuses = ['todo', 'in_progress', 'review'];
        $totalOverdue = $allTasksForStats
            ->whereIn('status', $overdueStatuses)
            ->filter(fn (Task $t): bool => $t->days_until_deadline !== null && $t->days_until_deadline <= 0)
            ->count();

        $stats = [
            'total_members' => count($members),
            'total_projects' => count($projects),
            'total_tasks' => $allTasksForStats->count(),
            'total_overdue' => $totalOverdue,
            'by_status' => $byStatus,
        ];

        $context = [
            'studio' => $studio?->only(['id', 'name']),
            'members' => $members,   // includes owner; use total_members for count
            'projects' => $projects,
            'tasks' => $allTasks,  // capped at 40; for exact counts use stats
            'stats' => $stats,     // pre-computed workspace-level aggregates
        ];

        $result = $this->mlService->chatAboutProject($message, $context, $validated['history'] ?? []);

        return response()->json([
            'status' => $result['status'] ?? 'error',
            'reply' => $result['reply'] ?? 'I could not answer that right now. Please try again.',
        ]);
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

        $studio = Studio::with([
            'users.globalProfile.position',
            'users.globalProfile.skills',
        ])->find(tenant('id'));

        $employeeProfiles = [];
        if ($studio && $studio->users) {
            foreach ($studio->users as $user) {
                $skills = [];
                if ($user->globalProfile && $user->globalProfile->skills) {
                    foreach ($user->globalProfile->skills as $s) {
                        $skills[] = [
                            'name' => $s->name,
                            'level' => (int) ($s->pivot->proficiency_level ?? 3),
                        ];
                    }
                }

                $macroDomains = [];
                try {
                    $macroDomains = $user->microDomains()->pluck('name')->all();
                } catch (\Exception $e) {
                }

                $employeeProfiles[] = [
                    'user_id' => $user->id,
                    'display_name' => $user->name,
                    'position' => $user->globalProfile && $user->globalProfile->position
                        ? $user->globalProfile->position->name
                        : 'Developer',
                    'experience_years' => (float) ($user->globalProfile->experience_years ?? 0.0),
                    'skills' => $skills,
                    'macro_domains' => $macroDomains,
                ];
            }
        }

        $payload = [
            'task' => $task->toGNNFeatureDict(),
            'employee_profiles' => $employeeProfiles,
        ];

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
            $synthesis = $this->mlService->synthesizeAssignment(
                $response['results'],
                $cpaSchedule,
                [
                    'title' => $task->title,
                    'difficulty' => $task->task_difficulty,
                    'required_skills' => $task->required_skills,
                ]
            );
            if ($synthesis['status'] === 'success') {
                $response['explanation'] = $synthesis['explanation'];
            }
        }

        return response()->json($response);
    }

    /**
     * Assign one or more team members to a task.
     *
     * Accepts either:
     *   - `employee_user_id`  (int)   — single assign (backward compat with BestFitModal)
     *   - `employee_user_ids` (array) — multi-assign (sprint planning + new BestFitModal flow)
     *
     * Cancels any previous active assignments, then inserts one row per selected user.
     * The task's `assigned_user_id` is set to the first/primary user.
     */
    public function assignTask(Request $request, $task, $routeTask = null)
    {
        $user = auth()->user();
        $isManager = false;
        if ($user && $user->role === User::ROLE_ADMIN) {
            $isManager = true;
        } else {
            $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
                ->where('studio_id', tenant('id'))
                ->where('user_id', $user->id)
                ->first();
            $role = $member ? $member->role : 'member';
            $isManager = in_array($role, ['owner', 'leader', 'manager']);
        }

        if (! $isManager) {
            abort(403, 'Unauthorized. Only studio managers can assign tasks.');
        }

        $task = $routeTask ?? $task;
        $task = Task::findOrFail($task);
        $centralConn = config('tenancy.database.central_connection', 'mysql');

        $validated = $request->validate([
            'employee_user_id' => "nullable|integer|exists:{$centralConn}.users,id",
            'employee_user_ids' => 'nullable|array',
            'employee_user_ids.*' => "integer|exists:{$centralConn}.users,id",
            'match_fit_score' => 'nullable|numeric|min:0|max:1',
            'assigned_by' => 'nullable|string|in:gnn,cold_start_baseline,manual',
        ]);

        // Normalise to an array of user IDs
        $userIds = [];
        if (! empty($validated['employee_user_ids'])) {
            $userIds = array_values(array_unique($validated['employee_user_ids']));
        } elseif (! empty($validated['employee_user_id'])) {
            $userIds = [$validated['employee_user_id']];
        }

        $assignees = empty($userIds) ? collect() : User::findMany($userIds);
        $assignedBy = $validated['assigned_by'] ?? 'gnn';
        $score = $validated['match_fit_score'] ?? null;

        DB::transaction(function () use ($task, $userIds, $assignedBy, $score): void {
            DB::table('assignments')
                ->where('task_id', $task->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            $now = now();
            foreach ($userIds as $userId) {
                DB::table('assignments')->insert([
                    'task_id' => $task->id,
                    'employee_user_id' => $userId,
                    'match_fit_score' => $score,
                    'assigned_by' => $assignedBy,
                    'match_source' => $assignedBy,
                    'status' => 'active',
                    'assigned_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // Clearing every selection is an intentional "leave unassigned"
            // action, not an invalid request.
            $task->update(['assigned_user_id' => $userIds[0] ?? null]);
        });

        return response()->json([
            'status' => 'success',
            'task_id' => $task->id,
            'assignees' => $assignees->map(fn (User $u): array => $u->only(['id', 'name']))->all(),
        ]);
    }

    /**
     * Preview best-fit candidates for a draft (unsaved) task during sprint planning review.
     *
     * Unlike `bestFit()`, this endpoint does not require a saved task DB record.
     * It accepts raw task fields + an optional skill list and calls the GNN directly.
     */
    public function previewBestFit(Request $request)
    {
        set_time_limit(0);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'required_skills' => 'nullable|array',
            'estimated_hours' => 'nullable|numeric',
            'task_difficulty' => 'nullable|string',
            'task_classification' => 'nullable|string',
            'priority' => 'nullable|string',
        ]);

        $studio = Studio::with([
            'users.globalProfile.position',
            'users.globalProfile.skills',
        ])->find(tenant('id'));

        $employeeProfiles = [];
        if ($studio && $studio->users) {
            foreach ($studio->users as $user) {
                if ($user->role === 'admin' && ! $user->globalProfile) {
                    continue;
                }

                $skills = [];
                if ($user->globalProfile && $user->globalProfile->skills) {
                    foreach ($user->globalProfile->skills as $s) {
                        $skills[] = [
                            'name' => $s->name,
                            'level' => (int) ($s->pivot->proficiency_level ?? 3),
                        ];
                    }
                }

                $macroDomains = [];
                try {
                    $macroDomains = $user->microDomains()->pluck('name')->all();
                } catch (\Exception $e) {
                }

                $employeeProfiles[] = [
                    'user_id' => $user->id,
                    'display_name' => $user->name,
                    'position' => $user->globalProfile && $user->globalProfile->position
                        ? $user->globalProfile->position->name
                        : 'Developer',
                    'experience_years' => (float) ($user->globalProfile->experience_years ?? 0.0),
                    'skills' => $skills,
                    'macro_domains' => $macroDomains,
                ];
            }
        }

        // Build a synthetic task feature dict from the raw fields
        $taskFeatures = [
            'title' => $validated['title'],
            'required_skills' => $validated['required_skills'] ?? [],
            'estimated_hours' => (float) ($validated['estimated_hours'] ?? 4.0),
            'task_difficulty' => $validated['task_difficulty'] ?? 'Medium',
            'task_classification' => $validated['task_classification'] ?? 'Feature',
            'priority' => $validated['priority'] ?? 'Medium',
            // Placeholders for CPA fields not yet computed
            'es' => 0, 'ef' => 0, 'ls' => 0, 'lf' => 0,
            'total_float' => 0, 'is_critical' => false,
            'days_until_deadline' => null,
        ];

        $payload = [
            'task' => $taskFeatures,
            'employee_profiles' => $employeeProfiles,
        ];

        $response = $this->mlService->getBestFit($payload);

        if (($response['status'] ?? null) === 'success' && ! empty($response['results'])) {
            // The GNN must only return members from this studio. Its training
            // dataset IDs are not valid central-user IDs when no profiles are sent.
            $teamMemberIds = collect($employeeProfiles)->pluck('user_id')->flip();
            $response['results'] = collect($response['results'])
                ->filter(fn (array $c): bool => $teamMemberIds->has($c['user_id']))
                ->values()
                ->all();
        }

        // Still give the manager named, selectable members if the ML service is
        // offline or cannot rank a newly created studio profile. This prevents
        // an empty recommendation screen while keeping the source transparent.
        if (empty($response['results']) && ! empty($employeeProfiles)) {
            $response = [
                'status' => 'success',
                'match_source' => 'manual_fallback',
                'results' => collect($employeeProfiles)
                    ->sortByDesc('experience_years')
                    ->map(fn (array $profile): array => [
                        'user_id' => $profile['user_id'],
                        'display_name' => $profile['display_name'],
                        'match_fit_score' => 0,
                        'match_source' => 'manual_fallback',
                    ])
                    ->values()
                    ->all(),
            ];
        }

        return response()->json($response);
    }

    /**
     * Answer project questions and provide the project intelligence cards.
     */
    public function projectAssistant(Request $request, $project, $routeProject = null)
    {
        set_time_limit(0);
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

        // ── Studio members (including the studio owner) ────────────────────
        $studio = Studio::with(['users'])->find(tenant('id'));
        $memberUserIds = $studio?->users?->pluck('id')?->all() ?? [];
        $activeTasksPerMember = Task::query()
            ->whereIn('status', ['todo', 'in_progress', 'review'])
            ->whereIn('assigned_user_id', $memberUserIds)
            ->selectRaw('assigned_user_id, COUNT(*) as active_task_count')
            ->groupBy('assigned_user_id')
            ->pluck('active_task_count', 'assigned_user_id');

        $members = $studio?->users?->map(function ($user) use ($activeTasksPerMember): array {
            $pivotRole = $user->pivot?->role ?? 'member';

            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $pivotRole,
                'is_owner' => $user->role === User::ROLE_ADMIN,
                'active_task_count' => (int) ($activeTasksPerMember[$user->id] ?? 0),
            ];
        })?->values()?->all() ?? [];

        $context = [
            'project' => $projectModel->only(['id', 'name', 'status', 'target_end_date']),
            'tasks' => $taskData,
            'stats' => $stats,
            'studio' => $studio?->only(['id', 'name']),
            'members' => $members,
        ];
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

            return response()->json([
                'status' => $result['status'],
                'reply' => $result['summary'] ?? 'Summary unavailable.',
                'data' => array_merge($result, ['stats' => $stats]),
            ]);
        }

        if ($mode === 'deadline') {
            return response()->json(['status' => 'success', 'reply' => "Based on {$remainingHours} remaining estimated hours and the current assigned-team capacity, {$projectModel->name} is projected to finish around {$predictedDate}.", 'data' => ['predicted_date' => $predictedDate]]);
        }

        $result = $this->mlService->chatWithIntent($validated['message'], $context, $validated['history'] ?? []);

        return response()->json([
            'status' => $result['status'] ?? 'error',
            'reply' => $result['reply'] ?? 'I could not answer that right now.',
            'intent' => $result['intent'] ?? 'qa',
            'action_payload' => $result['action_payload'] ?? null,
        ]);
    }

    private function authorizeManager()
    {
        $user = auth()->user();
        if ($user && $user->role === User::ROLE_ADMIN) {
            return;
        }

        $member = DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', $user->id)
            ->first();

        $role = $member ? $member->role : 'member';

        if (! in_array($role, ['owner', 'leader', 'manager'])) {
            abort(403, 'Unauthorized action. Only studio managers can perform this task.');
        }
    }

    /**
     * Execute a confirmed agentic action from the AI Assistant chat.
     */
    public function executeProjectAction(Request $request, $project, $routeProject = null)
    {
        $this->authorizeManager();
        $project = $routeProject ?? $project;
        $validated = $request->validate([
            'action' => 'required|string|in:create_task,decompose_sprint',
            'payload' => 'required|array',
        ]);

        $projectModel = Project::findOrFail($project);

        if ($validated['action'] === 'create_task') {
            $payload = $validated['payload'];
            $hours = isset($payload['estimated_hours']) ? (float) $payload['estimated_hours'] : 4.0;
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
                'title' => $payload['title'] ?? 'New Task',
                'description' => $payload['objective'] ?? $payload['description'] ?? null,
                'task_classification' => $payload['task_classification'] ?? 'Feature',
                'task_difficulty' => $payload['task_difficulty'] ?? 'Medium',
                'priority' => $payload['priority'] ?? 'Medium',
                'estimated_hours' => $hours,
                'days_until_deadline' => isset($payload['days_until_deadline']) ? (int) $payload['days_until_deadline'] : null,
                'hard_constraint_date' => $payload['hard_constraint_date'] ?? null,
                'minimum_experience_years' => isset($payload['minimum_experience_years']) ? (float) $payload['minimum_experience_years'] : 0.0,
                'target_macro_domains' => $payload['macro_domains'] ?? null,
                'required_position' => $payload['required_position'] ?? null,
                'required_skills' => $payload['required_skills'] ?? [],
                'story_points_ai_suggested' => $hours > 0 ? $points : null,
                'expected_estimators' => !empty($payload['assigned_user_id']) ? [$payload['assigned_user_id']] : null,
                'status' => 'todo',
            ]);

            RecomputeProjectSchedule::dispatchSync($projectModel->id);

            return response()->json([
                'status' => 'success',
                'message' => 'Task created successfully and schedule recalculated.',
                'task' => $task,
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Unsupported action type.',
        ], 400);
    }
}
