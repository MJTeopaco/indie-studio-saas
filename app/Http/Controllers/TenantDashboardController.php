<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Position;
use App\Models\Skill;
use Inertia\Inertia;

class TenantDashboardController extends Controller
{
    /**
     * Show the Tenant (Studio) Dashboard.
     *
     * By the time this controller is reached, stancl/tenancy has already
     * initialised the tenant context via InitializeTenancyByPath. The
     * tenant() helper therefore returns the active studio's data.
     */
    public function index()
    {
        $studio = Studio::find(tenant('id'));

        $projects = [];
        try {
            $projects = \App\Models\Tenant\Project::with(['tasks' => fn($q) => $q->select('id', 'project_id', 'title')])
                ->withCount(['projectMembers as members_count', 'tasks'])
                ->latest()
                ->get()
                ->map(function ($project) {
                    return [
                        'id'            => $project->id,
                        'name'          => $project->name,
                        'description'   => $project->description,
                        'status'        => $project->status,
                        'members_count' => $project->members_count ?? 0,
                        'tasks_count'   => $project->tasks_count ?? 0,
                        'tasks'         => $project->tasks->map(fn($t) => ['id' => $t->id, 'title' => $t->title]),
                    ];
                });
        } catch (\Exception $e) {
            $projects = [];
        }

        $activeTasks = [];
        try {
            $activeTasks = \App\Models\Tenant\Task::with('assignee')
                ->whereIn('status', ['todo', 'in_progress', 'review'])
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($task) {
                    $gnnMatchScore = null;
                    try {
                        $asg = \DB::table('assignments')
                            ->where('task_id', $task->id)
                            ->where('status', 'active')
                            ->first();
                        if ($asg && $asg->match_fit_score !== null) {
                            $gnnMatchScore = round($asg->match_fit_score * 100) . '% Fit';
                        }
                    } catch (\Exception $e) {
                    }

                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'classification' => $task->task_classification ?? 'Engineering',
                        'estimatedHours' => $task->estimated_hours ? $task->estimated_hours . 'h' : '8h',
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
                $pendingEstimatesCount = \App\Models\Tenant\Task::where('story_points_locked', false)
                    ->where('needs_estimate_review', false)
                    ->get()
                    ->filter(function ($task) use ($user) {
                        if (empty($task->expected_estimators)) {
                            return $task->assigned_user_id === $user->id;
                        }
                        return in_array($user->id, $task->expected_estimators);
                    })
                    ->filter(function ($task) use ($user) {
                        return !\App\Models\Tenant\TaskEstimateSubmission::where('task_id', $task->id)
                            ->where('developer_id', $user->id)
                            ->exists();
                    })
                    ->count();
            }
        } catch (\Exception $e) {}

        return Inertia::render('Tenant/Dashboard', [
            'studio' => [
                'id'   => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'projects' => $projects,
            'activeTasks' => $activeTasks,
            'skills' => $skills,
            'positions' => $positions,
            'teamMembers' => $teamMembers,
            'pendingEstimatesCount' => $pendingEstimatesCount,
        ]);
    }
}
