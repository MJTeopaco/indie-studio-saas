<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Studio;
use App\Models\User;
class InternalDataController extends Controller
{
    /**
     * Return lean workforce profile data: users, positions, skills, and micro-domains.
     */
    public function getWorkforceProfile(Request $request, $studioId)
    {
        tenancy()->initialize($studioId);
        $studio = Studio::with([
            'users.globalProfile.position',
            'users.globalProfile.skills'
        ])->find($studioId);

        if (!$studio) {
            return response()->json(['error' => 'Studio not found'], 404);
        }

        $profiles = [];
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

            $profiles[] = [
                'user_id' => $user->id,
                'name' => $user->name,
                'role' => $user->pivot->role ?? 'member',
                'position' => $user->globalProfile && $user->globalProfile->position ? $user->globalProfile->position->name : 'Developer',
                'experience_years' => (float) ($user->globalProfile->experience_years ?? 0.0),
                'skills' => $skills,
                'macro_domains' => $macroDomains,
            ];
        }

        return response()->json([
            'studio_id' => $studio->id,
            'studio_name' => $studio->name,
            'workforce' => $profiles,
        ]);
    }

    /**
     * Return lean sprint health data: task statuses, bottlenecks, and total float.
     */
    public function getSprintHealth(Request $request, $studioId)
    {
        tenancy()->initialize($studioId);
        $studio = Studio::find($studioId);
        if (!$studio) {
            return response()->json(['error' => 'Studio not found'], 404);
        }
        
        $projectIds = \App\Models\Tenant\Project::pluck('id')->toArray();
        
        $tasks = \App\Models\Tenant\Task::whereIn('project_id', $projectIds)
            ->whereIn('status', ['todo', 'in_progress', 'review'])
            ->get(['id', 'title', 'status', 'assigned_user_id', 'total_float', 'is_critical', 'estimated_hours', 'days_until_deadline']);
            
        $formattedTasks = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'status' => $task->status,
                'assigned_user_id' => $task->assigned_user_id,
                'total_float' => $task->total_float,
                'is_critical' => $task->is_critical,
                'estimated_hours' => $task->estimated_hours,
                'is_overdue' => $task->days_until_deadline !== null && $task->days_until_deadline <= 0,
            ];
        });

        return response()->json([
            'studio_id' => $studioId,
            'active_tasks' => $formattedTasks
        ]);
    }

    /**
     * Return lean workload data for a specific developer.
     */
    public function getDeveloperWorkload(Request $request, $studioId, $userId)
    {
        tenancy()->initialize($studioId);
        $studio = Studio::find($studioId);
        if (!$studio) {
            return response()->json(['error' => 'Studio not found'], 404);
        }

        $projectIds = \App\Models\Tenant\Project::pluck('id')->toArray();

        $tasks = \App\Models\Tenant\Task::whereIn('project_id', $projectIds)
            ->where('assigned_user_id', $userId)
            ->whereIn('status', ['todo', 'in_progress', 'review'])
            ->get(['id', 'title', 'status', 'estimated_hours']);

        $totalEstimatedHours = $tasks->sum('estimated_hours');

        return response()->json([
            'studio_id' => $studioId,
            'user_id' => $userId,
            'active_task_count' => $tasks->count(),
            'total_estimated_hours' => $totalEstimatedHours,
            'tasks' => $tasks
        ]);
    }

    /**
     * Return unassigned tasks for a specific sprint in a project.
     * Supports dynamic resolution for "current", "active", or "latest".
     */
    public function getUnassignedSprintTasks(Request $request, $studioId, $projectId, $sprintName)
    {
        tenancy()->initialize($studioId);
        $project = \App\Models\Tenant\Project::with('sprints')->find($projectId);
        if (!$project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $sprintNameLower = strtolower(trim($sprintName));
        $sprint = null;

        if (in_array($sprintNameLower, ['current', 'active', 'latest'])) {
            // Find the active sprint based on dates or status. 
            // Assuming there's a status or we find the one currently in progress.
            $sprint = $project->sprints()->where('status', 'active')->first();
            if (!$sprint) {
                // Fallback: finding sprint that encompasses today
                $now = now();
                $sprint = $project->sprints()
                    ->where('start_date', '<=', $now)
                    ->where('target_end_date', '>=', $now)
                    ->first();
            }
            if (!$sprint) {
                // Fallback: get the most recent sprint
                $sprint = $project->sprints()->orderBy('start_date', 'desc')->first();
            }

            if (!$sprint) {
                return response()->json(['status' => 'error', 'message' => 'No active sprint found for this project.'], 404);
            }
        } else {
            // Strict name match
            $sprint = $project->sprints()->whereRaw('LOWER(name) = ?', [$sprintNameLower])->first();
            if (!$sprint) {
                return response()->json(['status' => 'error', 'message' => "Sprint '{$sprintName}' not found."], 404);
            }
        }

        $tasks = \App\Models\Tenant\Task::where('project_id', $projectId)
            ->where('sprint_id', $sprint->id)
            ->whereNull('assigned_user_id')
            ->get(['id', 'title', 'estimated_hours', 'task_classification', 'status']);

        return response()->json([
            'status' => 'success',
            'project_id' => $projectId,
            'sprint_id' => $sprint->id,
            'sprint_name' => $sprint->name,
            'unassigned_tasks' => $tasks
        ]);
    }

    /**
     * Get tasks for a specific project with pagination limits and smart filtering.
     * Prevents token-limit crashes by capping the payload.
     */
    public function getProjectTasks(Request $request, $studioId, $projectId)
    {
        tenancy()->initialize($studioId);
        $project = \App\Models\Tenant\Project::find($projectId);
        if (!$project) {
            return response()->json(['status' => 'error', 'message' => 'Project not found.'], 404);
        }

        $limit = 50;
        
        $query = \App\Models\Tenant\Task::where('project_id', $projectId)
            ->orderByRaw("CASE WHEN status IN ('in_progress', 'todo') THEN 1 ELSE 2 END")
            ->orderBy('priority', 'desc')
            ->orderBy('updated_at', 'desc');

        $totalTasks = $query->count();
        $tasks = $query->limit($limit)->get(['id', 'title', 'status', 'priority', 'sprint_id', 'assigned_user_id']);

        return response()->json([
            'status' => 'success',
            'project_id' => $projectId,
            'project_name' => $project->name,
            'tasks' => $tasks,
            'meta' => [
                'total_tasks' => $totalTasks,
                'showing' => $tasks->count(),
                'note' => $totalTasks > $limit 
                    ? "List truncated. Use specific sprint filters for more granularity." 
                    : "All tasks retrieved."
            ]
        ]);
    }
}
