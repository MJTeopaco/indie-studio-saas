<?php

namespace App\Http\Controllers;

use App\Jobs\RecomputeProjectSchedule;
use App\Models\Position;
use App\Models\Skill;
use App\Models\Studio;
use App\Models\Tenant\Epic;
use App\Models\Tenant\EpicPhase;
use App\Models\Tenant\EpicPriority;
use App\Models\Tenant\Project;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TenantProjectController extends Controller
{
    private function authorizeManager()
    {
        $user = auth()->user();
        if ($user && $user->role === User::ROLE_ADMIN) {
            return;
        }

        $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', $user->id)
            ->first();

        $role = $member ? $member->role : 'member';

        if (! in_array($role, ['owner', 'leader', 'manager'])) {
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

        $projectModel = Project::with([
            'tasks.assignee',
            'tasks.predecessors',
            'epics' => function ($query) {
                $query->withCount('tasks')
                    ->withSum('tasks', 'estimated_hours')
                    ->withSum('tasks', 'story_points')
                    ->with(['phase', 'priority', 'tasks' => function ($q) {
                        $q->select('id', 'epic_id', 'title', 'status', 'sprint_status');
                    }]);
            },
        ])->findOrFail($project);

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
            'epics' => $projectModel->epics,
            'epicGroups' => function () use ($projectModel) {
                return $projectModel->epicGroups()->orderBy('is_default', 'asc')->orderBy('display_order', 'asc')->get();
            },
            'sprints' => function () use ($projectModel, &$assignmentIdsByTask, &$membersById) {
                return $projectModel->sprints()
                    ->orderBy('created_at')
                    ->with(['tasks' => function ($q) {
                        $q->select([
                            'id', 'sprint_id', 'project_id', 'epic_id',
                            'title', 'status', 'sprint_status', 'sprint_priority',
                            'task_classification', 'story_points', 'actual_story_points',
                            'github_link', 'assigned_user_id', 'priority',
                        ])->with('epic:id,name,color');
                    }])->get()->map(function ($sprint) use (&$assignmentIdsByTask, &$membersById) {
                        $sprint->tasks->each(function ($task) use (&$assignmentIdsByTask, &$membersById) {
                            $task->setAttribute('assignees', collect($assignmentIdsByTask->get($task->id, []))
                                ->map(fn ($assignment) => $membersById->get($assignment->employee_user_id))
                                ->filter()
                                ->values()
                                ->all());
                        });

                        return $sprint;
                    });
            },
            'backlogTasks' => function () use ($projectModel) {
                return $projectModel->tasks->whereNull('sprint_id')->values();
            },
            'epicPhases' => EpicPhase::where('tenant_id', tenant('id') ?? 'default')->orderBy('sort_order')->get(),
            'epicPriorities' => EpicPriority::where('tenant_id', tenant('id') ?? 'default')->orderBy('sort_order')->get(),
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
                'expected_estimators' => ! empty($taskData['assigned_user_ids']) ? $taskData['assigned_user_ids'] : null,
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
     * Store a bulk hierarchy of epics, sprints, and tasks (e.g. from an AI Hierarchical Decomposition).
     */
    public function storeBulkHierarchy(Request $request, $project, $routeProject = null)
    {
        $this->authorizeManager();
        $project = $routeProject ?? $project;
        $projectModel = is_string($project) ? Project::findOrFail($project) : $project;
        
        $validated = $request->validate([
            'epics' => 'nullable|array',
            'epics.*.epic_name' => 'required|string|max:255',
            'epics.*.epic_description' => 'nullable|string',
            'epics.*.phase_label' => 'nullable|string|max:255',
            'epics.*.priority_label' => 'nullable|string|max:255',
            'epics.*.tasks' => 'nullable|array',
            'epics.*.tasks.*.title' => 'required|string|max:255',
            'epics.*.tasks.*.objective' => 'nullable|string',
            'epics.*.tasks.*.estimated_hours' => 'nullable|numeric',
            'epics.*.tasks.*.task_classification' => 'nullable|string',
            'epics.*.tasks.*.task_difficulty' => 'nullable|string',
            'epics.*.tasks.*.priority' => 'nullable|string',
            'epics.*.tasks.*.days_until_deadline' => 'nullable|numeric',
            'epics.*.tasks.*.hard_constraint_date' => 'nullable|string',
            'epics.*.tasks.*.suggested_depends_on' => 'nullable|array',
            'epics.*.tasks.*.minimum_experience_years' => 'nullable|numeric',
            'epics.*.tasks.*.macro_domains' => 'nullable|array',
            'epics.*.tasks.*.required_position' => 'nullable|string',
            'epics.*.tasks.*.assigned_user_ids' => 'nullable|array',
            'epics.*.tasks.*.required_skills' => 'nullable|array',
            'epics.*.tasks.*.required_skills.*.name' => 'required|string',
            'epics.*.tasks.*.required_skills.*.level' => 'nullable|integer|min:1|max:5',
            
            'sprints' => 'nullable|array',
            'sprints.*.name' => 'required|string|max:255',
            'sprints.*.goal' => 'nullable|string',
            'sprints.*.duration_weeks' => 'nullable|integer',
            'sprints.*.epic_indices' => 'nullable|array',
            'sprints.*.tasks' => 'nullable|array',
            'sprints.*.tasks.*.title' => 'required|string|max:255',
            'sprints.*.tasks.*.objective' => 'nullable|string',
            'sprints.*.tasks.*.estimated_hours' => 'nullable|numeric',
            'sprints.*.tasks.*.task_classification' => 'nullable|string',
            'sprints.*.tasks.*.task_difficulty' => 'nullable|string',
            'sprints.*.tasks.*.priority' => 'nullable|string',
            'sprints.*.tasks.*.days_until_deadline' => 'nullable|numeric',
            'sprints.*.tasks.*.hard_constraint_date' => 'nullable|string',
            'sprints.*.tasks.*.suggested_depends_on' => 'nullable|array',
            'sprints.*.tasks.*.minimum_experience_years' => 'nullable|numeric',
            'sprints.*.tasks.*.macro_domains' => 'nullable|array',
            'sprints.*.tasks.*.required_position' => 'nullable|string',
            'sprints.*.tasks.*.assigned_user_ids' => 'nullable|array',
            'sprints.*.tasks.*.required_skills' => 'nullable|array',
            'sprints.*.tasks.*.required_skills.*.name' => 'required|string',
            'sprints.*.tasks.*.required_skills.*.level' => 'nullable|integer|min:1|max:5',

            'backlog_tasks' => 'nullable|array',
            'backlog_tasks.*.title' => 'required|string|max:255',
            'backlog_tasks.*.objective' => 'nullable|string',
            'backlog_tasks.*.estimated_hours' => 'nullable|numeric',
            'backlog_tasks.*.task_classification' => 'nullable|string',
            'backlog_tasks.*.task_difficulty' => 'nullable|string',
            'backlog_tasks.*.priority' => 'nullable|string',
            'backlog_tasks.*.days_until_deadline' => 'nullable|numeric',
            'backlog_tasks.*.hard_constraint_date' => 'nullable|string',
            'backlog_tasks.*.suggested_depends_on' => 'nullable|array',
            'backlog_tasks.*.minimum_experience_years' => 'nullable|numeric',
            'backlog_tasks.*.macro_domains' => 'nullable|array',
            'backlog_tasks.*.required_position' => 'nullable|string',
            'backlog_tasks.*.assigned_user_ids' => 'nullable|array',
            'backlog_tasks.*.required_skills' => 'nullable|array',
            'backlog_tasks.*.required_skills.*.name' => 'required|string',
            'backlog_tasks.*.required_skills.*.level' => 'nullable|integer|min:1|max:5',
        ]);

        $epicsData = $validated['epics'] ?? [];
        $sprintsData = $validated['sprints'] ?? [];
        $backlogTasksData = $validated['backlog_tasks'] ?? [];
        $projectModel = Project::findOrFail($project);
        
        // 1. Pre-fetch the tenant's valid phases and priorities for epics to avoid N+1 issues
        $tenantId = tenant('id') ?? 'default';
        $defaultPhase = EpicPhase::where('tenant_id', $tenantId)->first();
        $defaultPriority = EpicPriority::where('tenant_id', $tenantId)->first();
        
        $validPhaseLabels = EpicPhase::where('tenant_id', $tenantId)->pluck('id', 'label')->mapWithKeys(fn($id, $label) => [strtolower($label) => $id])->all();
        $validPriorityLabels = EpicPriority::where('tenant_id', $tenantId)->pluck('id', 'label')->mapWithKeys(fn($id, $label) => [strtolower($label) => $id])->all();

        $defaultEpicGroup = $projectModel->epicGroups()->where('is_default', true)->first();

        // Data arrays for processing
        
        $epicIdMapping = []; // map index in $epicsData to real DB Epic ID
        $taskIdMapping = []; // map flat index across all tasks to real DB Task ID
        $sprintIdMapping = []; // map index in $sprintsData to real DB Sprint ID

        DB::transaction(function () use (
            $projectModel, $epicsData, $sprintsData, $defaultEpicGroup, 
            $defaultPhase, $defaultPriority, $validPhaseLabels, $validPriorityLabels,
            &$epicIdMapping, &$taskIdMapping, &$sprintIdMapping
        ) {
            // Step 1: Store Epics
            foreach ($epicsData as $epicIndex => $epicData) {
                $phaseLabel = strtolower($epicData['phase_label'] ?? '');
                $priorityLabel = strtolower($epicData['priority_label'] ?? '');
                
                $phaseId = $validPhaseLabels[$phaseLabel] ?? $defaultPhase->id ?? null;
                $priorityId = $validPriorityLabels[$priorityLabel] ?? $defaultPriority->id ?? null;
                
                if (!$phaseId || !$priorityId) {
                    abort(500, 'Epic Phase or Priority configuration is missing for this workspace.');
                }
                
                $epic = $projectModel->epics()->create([
                    'name' => $epicData['epic_name'],
                    'description' => $epicData['epic_description'] ?? null,
                    'phase_id' => $phaseId,
                    'priority_id' => $priorityId,
                    'epic_group_id' => $defaultEpicGroup?->id,
                    'color' => '#10b981', // Default green
                    'status' => 'draft',
                ]);
                $epicIdMapping[$epicIndex] = $epic->id;
            }

            // Step 2: Store Sprints
            foreach ($sprintsData as $sprintIndex => $sprintData) {
                $sprint = $projectModel->sprints()->create([
                    'name' => $sprintData['name'],
                    'goal' => $sprintData['goal'] ?? null,
                    'status' => 'planned',
                    // Default to today and +14 days since LLM doesn't output dates here
                    'start_date' => now()->toDateString(),
                    'end_date' => now()->addDays(14)->toDateString(),
                ]);
                $sprintIdMapping[$sprintIndex] = $sprint->id;
            }

            // Step 3: Create Tasks and Assignments
            $tasksToProcessDependencies = [];
            $flatTaskIndex = 0;

            $processTask = function ($taskData, $epicId, $sprintId) use ($projectModel, &$tasksToProcessDependencies, &$taskIdMapping, &$flatTaskIndex) {
                // Ensure story points map correctly to hours if needed
                $hours = (float) ($taskData['estimated_hours'] ?? 0);
                $points = null;
                if ($hours > 0 && $hours <= 4) {
                    $points = 1;
                } elseif ($hours > 4 && $hours <= 8) {
                    $points = 2;
                } elseif ($hours > 8 && $hours <= 16) {
                    $points = 3;
                } elseif ($hours > 16 && $hours <= 24) {
                    $points = 5;
                } elseif ($hours > 24 && $hours <= 40) {
                    $points = 8;
                } elseif ($hours > 40) {
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
                    'epic_id' => $epicId,
                    'sprint_id' => $sprintId,
                    'sprint_status' => $sprintId ? 'ready_to_start' : null,
                ]);

                \Log::info("Created Task: {$task->id} for Epic ID {$epicId}, Sprint ID {$sprintId}");

                $taskIdMapping[$flatTaskIndex] = $task->id;
                
                if (!empty($taskData['suggested_depends_on'])) {
                    $tasksToProcessDependencies[$task->id] = $taskData['suggested_depends_on'];
                }

                // Create assignments for any inline-assigned users
                $assignedUserIds = $taskData['assigned_user_ids'] ?? [];
                if (!empty($assignedUserIds)) {
                    $now = now();
                    $primaryId = $assignedUserIds[0] ?? null;
                    foreach ($assignedUserIds as $userId) {
                        DB::table('assignments')->insert([
                            'task_id' => $task->id,
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
                        $task->update(['assigned_user_id' => $primaryId]);
                    }
                }

                $flatTaskIndex++;
            };

            foreach ($epicsData as $epicIndex => $epicData) {
                $epicId = $epicIdMapping[$epicIndex];
                $sprintId = null;
                foreach ($sprintsData as $sprintIndex => $sprintData) {
                    if (in_array($epicIndex, $sprintData['epic_indices'] ?? [])) {
                        $sprintId = $sprintIdMapping[$sprintIndex] ?? null;
                        break;
                    }
                }

                foreach ($epicData['tasks'] ?? [] as $taskData) {
                    $processTask($taskData, $epicId, $sprintId);
                }
            }

            foreach ($sprintsData as $sprintIndex => $sprintData) {
                $sprintId = $sprintIdMapping[$sprintIndex] ?? null;
                foreach ($sprintData['tasks'] ?? [] as $taskData) {
                    $processTask($taskData, null, $sprintId);
                }
            }

            foreach ($backlogTasksData as $taskData) {
                $processTask($taskData, null, null);
            }

            // Step 4: Resolve Dependencies
            foreach ($tasksToProcessDependencies as $realTaskId => $suggestedDepIndices) {
                $realDependsOnIds = [];
                foreach ($suggestedDepIndices as $depIndex) {
                    if (isset($taskIdMapping[$depIndex]) && $taskIdMapping[$depIndex] !== $realTaskId) {
                        $realDependsOnIds[] = $taskIdMapping[$depIndex];
                    }
                }
                
                if (!empty($realDependsOnIds)) {
                    $task = Task::find($realTaskId);
                    $task->predecessors()->syncWithoutDetaching(array_unique($realDependsOnIds));
                }
            }
        });

        RecomputeProjectSchedule::dispatchSync($projectModel->id);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Hierarchy saved successfully. The timeline is being recalculated.',
                'project_id' => $projectModel->id,
            ]);
        }

        return redirect()->back()->with('success', 'Hierarchy saved successfully. The timeline is being recalculated.');
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
            'reviewer_user_id' => 'nullable|integer',
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
                'reviewer_user_id' => $validated['reviewer_user_id'] ?? null,
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

            if (! empty($validated['assigned_user_id'])) {
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
            // Check if they tried to update any field other than 'status' or 'sprint_status'
            $modifiedFields = array_keys($request->except(['status', 'sprint_status', '_method', '_token']));
            if (! empty($modifiedFields)) {
                abort(403, 'Unauthorized. Members can only update task status.');
            }

            // Ensure user is the assigned doer or reviewer
            $isDoer = ((int) $taskModel->assigned_user_id === (int) $user->id) || DB::table('assignments')
                ->where('task_id', $taskModel->id)
                ->where('employee_user_id', $user->id)
                ->where('status', 'active')
                ->exists();
            $isReviewer = (int) $taskModel->reviewer_user_id === (int) $user->id;
            $hasReviewer = ! empty($taskModel->reviewer_user_id);

            if (! $isDoer && ! $isReviewer) {
                abort(403, 'Unauthorized. You can only update tasks assigned to you or assigned to you for review.');
            }

            $validated = $request->validate([
                'status' => 'sometimes|required|string|in:todo,in_progress,review,completed,stuck',
                'sprint_status' => 'sometimes|nullable|string|max:50',
            ]);

            // Sync sprint_status and status if one was supplied
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
            $currentStatus = $taskModel->status;

            if ($currentStatus === 'review' && $newStatus === 'completed' && ! $isReviewer) {
                abort(403, 'Only the assigned reviewer can mark this task as done.');
            }

            if ($currentStatus === 'in_progress' && $newStatus === 'completed' && $hasReviewer && ! $isReviewer) {
                abort(403, 'This task requires reviewer approval. Move it to "In Review" first.');
            }

            if (in_array($currentStatus, ['in_progress', 'review', 'completed']) && $newStatus === 'todo') {
                abort(422, 'You cannot move a task back to "To Do" once started.');
            }
        } else {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'assigned_user_id' => 'nullable|integer',
                'reviewer_user_id' => 'nullable|integer',
                'assignees' => 'sometimes|array',
                'assignees.*' => 'integer',
                'estimated_hours' => 'sometimes|required|numeric|min:0',
                'hard_constraint_date' => 'nullable|date',
                'priority' => 'sometimes|required|string|in:Low,Medium,High,Critical',
                'status' => 'sometimes|required|string|in:todo,in_progress,review,completed,stuck',
                'sprint_status' => 'sometimes|nullable|string|max:50',
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

            if (array_key_exists('assignees', $validated)) {
                DB::table('assignments')->where('task_id', $taskModel->id)->where('status', 'active')->update(['status' => 'cancelled']);

                foreach ($validated['assignees'] as $employeeId) {
                    DB::table('assignments')->insert([
                        'task_id' => $taskModel->id,
                        'employee_user_id' => $employeeId,
                        'match_fit_score' => null,
                        'assigned_by' => 'manual',
                        'match_source' => 'manual',
                        'status' => 'active',
                        'assigned_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // Keep the first ID for legacy compatibility if we want, or set null if empty
                $taskModel->assigned_user_id = count($validated['assignees']) > 0 ? $validated['assignees'][0] : null;
                $taskModel->save();

            } elseif (array_key_exists('assigned_user_id', $validated) && (int) $validated['assigned_user_id'] !== (int) $oldAssignedId) {
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
                'errors' => ['name' => ['A sprint with this name already exists in this project.']],
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

    /**
     * Store a newly created epic in storage.
     */
    public function storeEpic(Request $request, $project)
    {
        $projectModel = Project::findOrFail($project);
        $tenantId = tenant('id') ?? 'default';

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'epic_group_id' => 'nullable|exists:epic_groups,id',
            'phase_id' => 'required|exists:epic_phases,id',
            'priority_id' => 'required|exists:epic_priorities,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Default to the Epics Backlog if no group is provided
        if (empty($validated['epic_group_id'])) {
            $defaultGroup = $projectModel->epicGroups()->where('is_default', true)->first();
            $validated['epic_group_id'] = $defaultGroup?->id;
        }

        $epicPhase = EpicPhase::where('tenant_id', $tenantId)->find($validated['phase_id']);
        $epicPriority = EpicPriority::where('tenant_id', $tenantId)->find($validated['priority_id']);

        if (! $epicPhase || ! $epicPriority) {
            abort(400, 'Invalid phase or priority for this tenant.');
        }

        $projectModel->epics()->create([
            'name' => $validated['name'],
            'epic_group_id' => $validated['epic_group_id'],
            'phase_id' => $epicPhase->id,
            'priority_id' => $epicPriority->id,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'color' => '#10b981', // Default green, can be changed later
        ]);

        return redirect()->back()->with('success', 'Epic created successfully.');
    }

    /**
     * Update an epic's attributes.
     */
    public function updateEpic(Request $request, $project, $epic, $routeEpic = null)
    {
        $this->authorizeManager();
        if ($routeEpic !== null) {
            $project = $epic;
            $epic = $routeEpic;
        }

        $projectModel = Project::findOrFail($project);

        // Ownership check: Ensure project belongs to current tenant
        if ($projectModel->tenant_id && $projectModel->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized. Project does not belong to the current tenant.');
        }

        $epicModel = Epic::findOrFail($epic);

        if ($epicModel->project_id !== $projectModel->id) {
            abort(404, 'Epic not found in this project.');
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phase_id' => 'nullable|integer',
            'priority_id' => 'nullable|integer',
            'epic_group_id' => 'nullable|exists:epic_groups,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $tenantId = tenant('id') ?? 'default';

        if (isset($validated['phase_id'])) {
            $phase = EpicPhase::where('tenant_id', $tenantId)->find($validated['phase_id']);
            if (! $phase) {
                abort(422, 'Invalid phase selected.');
            }
        }

        if (isset($validated['priority_id'])) {
            $priority = EpicPriority::where('tenant_id', $tenantId)->find($validated['priority_id']);
            if (! $priority) {
                abort(422, 'Invalid priority selected.');
            }
        }

        $epicModel->update($validated);

        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->ajax())) {
            return response()->json([
                'status' => 'success',
                'epic' => $epicModel->load('phase', 'priority'),
            ]);
        }

        return redirect()->back()->with('success', 'Epic updated successfully.');
    }

    /**
     * Check if the current user can edit a task inline.
     */
    private function canEditTaskInline(Task $task, User $user): bool
    {
        $member = DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', $user->id)
            ->first();

        $role = $member ? $member->role : 'member';
        if (in_array($role, ['owner', 'leader', 'manager']) || $user->role === User::ROLE_ADMIN) {
            return true;
        }

        if ((int) $task->assigned_user_id === (int) $user->id || (int) $task->reviewer_user_id === (int) $user->id) {
            return true;
        }

        return DB::table('assignments')
            ->where('task_id', $task->id)
            ->where('employee_user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Update a task inline from the sprint board.
     */
    public function updateTaskInline(Request $request, $project, $task, $routeTask = null)
    {
        if ($routeTask !== null) {
            $project = $task;
            $task = $routeTask;
        }

        $projectModel = Project::findOrFail($project);
        if ($projectModel->tenant_id && $projectModel->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized.');
        }

        $taskModel = Task::findOrFail($task);
        if ($taskModel->project_id !== $projectModel->id) {
            abort(404, 'Task not found in this project.');
        }

        $user = auth()->user();
        $isManager = false;

        $member = DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', $user->id)
            ->first();

        $role = $member ? $member->role : 'member';
        if (in_array($role, ['owner', 'leader', 'manager']) || $user->role === User::ROLE_ADMIN) {
            $isManager = true;
        }

        if (! $this->canEditTaskInline($taskModel, $user)) {
            return response()->json([
                'message' => 'Unauthorized. You must be the assigned member, reviewer, or a manager to edit this task.',
            ], 403);
        }

        if ($request->has('actual_story_points') && $taskModel->sprint_status !== 'done' && $request->input('sprint_status') !== 'done') {
            return response()->json([
                'message' => 'Actual SP can only be set when the task status is Done.',
                'errors' => ['actual_story_points' => ['Task must be Done before setting Actual SP.']],
            ], 422);
        }

        $rules = [
            'sprint_status' => 'nullable|string|in:ready_to_start,in_progress,waiting_for_review,pending_deploy,done,stuck',
            'sprint_priority' => 'nullable|string|in:critical,high,medium,low',
            'task_classification' => 'nullable|string|max:100',
            'actual_story_points' => 'nullable|integer|min:0|max:100',
            'github_link' => 'nullable|url|max:500',
        ];

        if ($isManager) {
            $rules['story_points'] = 'nullable|integer|min:0|max:100';
            $rules['epic_id'] = 'nullable|exists:epics,id';
        }

        $validated = $request->validate($rules);

        $newSprintStatus = $validated['sprint_status'] ?? null;
        if (! $isManager && $newSprintStatus !== null) {
            $currentSprintStatus = $taskModel->sprint_status ?? ($taskModel->status === 'completed' ? 'done' : ($taskModel->status === 'review' ? 'waiting_for_review' : $taskModel->status));
            $isReviewer = (int) $taskModel->reviewer_user_id === (int) $user->id;
            $hasReviewer = ! empty($taskModel->reviewer_user_id);

            // Only assigned reviewer or manager can mark done from review
            if (in_array($currentSprintStatus, ['waiting_for_review', 'pending_deploy']) && $newSprintStatus === 'done' && ! $isReviewer) {
                return response()->json([
                    'message' => 'Only the assigned reviewer can mark this task as done.',
                ], 403);
            }

            // Doer cannot skip review directly to done if a reviewer is assigned
            if ($currentSprintStatus === 'in_progress' && $newSprintStatus === 'done' && $hasReviewer && ! $isReviewer) {
                return response()->json([
                    'message' => 'This task requires reviewer approval. Move it to "In Review" first.',
                ], 403);
            }

            // Cannot go back to ready_to_start once in progress or beyond
            if (in_array($currentSprintStatus, ['in_progress', 'waiting_for_review', 'pending_deploy', 'done']) && $newSprintStatus === 'ready_to_start') {
                return response()->json([
                    'message' => 'You cannot move a task back to "Ready to Start" once started.',
                ], 422);
            }
        }

        if (isset($validated['sprint_status'])) {
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
        }

        $taskModel->update($validated);

        return response()->json([
            'status' => 'success',
            'task' => $taskModel,
        ]);
    }

    /**
     * Return sprint performance summary for the closure modal.
     * Called when the user clicks "Complete Sprint" (or when "Start Sprint"
     * would displace a currently-active sprint) — before any action is taken.
     */
    public function getSprintSummary(Request $request, $project, $sprint)
    {
        $this->authorizeManager();

        $projectModel = Project::findOrFail($project);
        $sprintModel = Sprint::with('tasks')->findOrFail($sprint);

        abort_unless($sprintModel->project_id === $projectModel->id, 404);

        $tasks = $sprintModel->tasks;
        $done = $tasks->where('sprint_status', 'done');
        $incomplete = $tasks->where('sprint_status', '!=', 'done');

        // Other planned/active sprints that can receive the incomplete tasks
        $availableSprints = Sprint::where('project_id', $projectModel->id)
            ->whereKeyNot($sprintModel->id)
            ->whereIn('status', ['planned', 'active'])
            ->orderBy('created_at')
            ->get(['id', 'name', 'start_date', 'end_date', 'status']);

        return response()->json([
            'sprint' => [
                'id' => $sprintModel->id,
                'name' => $sprintModel->name,
            ],
            'summary' => [
                'total_tasks' => $tasks->count(),
                'done_count' => $done->count(),
                'incomplete_count' => $incomplete->count(),
                'estimated_sp_total' => $tasks->sum('story_points'),
                'actual_sp_burned' => $done->sum('actual_story_points'),
                'completion_rate_pct' => $tasks->count()
                    ? round(($done->count() / $tasks->count()) * 100)
                    : 0,
            ],
            'available_sprints' => $availableSprints,
        ]);
    }

    /**
     * Atomically activate a sprint, sweeping any concurrently-active
     * siblings first. Single code path — never call ->update(['status' => 'active'])
     * on a sprint directly outside of this method.
     */
    private function activateSprint(Sprint $sprint, Project $project): void
    {
        Sprint::where('project_id', $project->id)
            ->where('status', 'active')
            ->whereKeyNot($sprint->id)
            ->lockForUpdate()
            ->update(['status' => 'completed']);

        $sprint->update(['status' => 'active']);
    }

    /**
     * Update a sprint's details (name, goal, dates).
     * Intentionally separate from updateSprintStatus to keep concerns clean.
     */
    public function updateSprint(Request $request, $project, $sprint, $routeSprint = null)
    {
        $this->authorizeManager();

        if ($routeSprint !== null) {
            $project = $sprint;
            $sprint = $routeSprint;
        }

        $projectModel = Project::findOrFail($project);
        if ($projectModel->tenant_id && $projectModel->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized.');
        }

        $sprintModel = Sprint::findOrFail($sprint);
        if ($sprintModel->project_id !== $projectModel->id) {
            abort(404, 'Sprint not found in this project.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'goal' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        // Validate unique name within project, excluding the current sprint
        $exists = Sprint::where('project_id', $projectModel->id)
            ->where('name', $validated['name'])
            ->where('id', '!=', $sprintModel->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => ['name' => ['A sprint with this name already exists in this project.']],
            ], 422);
        }

        $sprintModel->update($validated);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'status' => 'success',
                'sprint' => $sprintModel,
            ]);
        }

        return redirect()->back()->with('success', 'Sprint updated successfully.');
    }

    /**
     * Update a sprint's status.
     */
    public function updateSprintStatus(Request $request, $project, $sprint, $routeSprint = null)
    {
        $this->authorizeManager();

        if ($routeSprint !== null) {
            $project = $sprint;
            $sprint = $routeSprint;
        }

        $projectModel = Project::findOrFail($project);
        if ($projectModel->tenant_id && $projectModel->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized.');
        }

        $sprintModel = Sprint::findOrFail($sprint);
        if ($sprintModel->project_id !== $projectModel->id) {
            abort(404, 'Sprint not found in this project.');
        }

        $validated = $request->validate([
            'status' => 'required|string|in:planned,active,completed',
            'incomplete_task_action' => 'nullable|string|in:keep,move_to_sprint,move_to_backlog',
            'move_to_sprint_id' => 'nullable|integer|exists:sprints,id',
            'activate_next_sprint_id' => 'nullable|integer|exists:sprints,id',
        ]);

        $newStatus = $validated['status'];

        DB::transaction(function () use ($projectModel, $sprintModel, $newStatus, $validated) {
            if ($newStatus === 'active') {
                $this->activateSprint($sprintModel, $projectModel);

                return;
            }

            $sprintModel->update(['status' => $newStatus]);

            if ($newStatus === 'completed') {
                $action = $validated['incomplete_task_action'] ?? 'keep';

                if ($action === 'move_to_sprint' && ! empty($validated['move_to_sprint_id'])) {
                    $targetSprint = Sprint::where('project_id', $projectModel->id)
                        ->whereIn('status', ['planned', 'active'])
                        ->whereKeyNot($sprintModel->id)
                        ->findOrFail($validated['move_to_sprint_id']);

                    Task::where('sprint_id', $sprintModel->id)
                        ->where('sprint_status', '!=', 'done')
                        ->update([
                            'sprint_id' => $targetSprint->id,
                            'sprint_status' => 'ready_to_start',
                        ]);

                } elseif ($action === 'move_to_backlog') {
                    Task::where('sprint_id', $sprintModel->id)
                        ->where('sprint_status', '!=', 'done')
                        ->update([
                            'sprint_id' => null,
                            'sprint_status' => 'ready_to_start',
                        ]);
                }

                if (! empty($validated['activate_next_sprint_id'])) {
                    $nextSprint = Sprint::where('project_id', $projectModel->id)
                        ->where('status', 'planned')
                        ->findOrFail($validated['activate_next_sprint_id']);

                    $this->activateSprint($nextSprint, $projectModel);
                }
            }
        });

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'status' => 'success',
                'sprint' => $sprintModel,
            ]);
        }

        return redirect()->back()->with('success', 'Sprint updated successfully.');
    }
}
