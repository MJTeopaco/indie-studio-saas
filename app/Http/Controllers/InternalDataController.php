<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Task;
use Illuminate\Http\Request;

class InternalDataController extends Controller
{
    /**
     * Return lean workforce profile data: users, positions, skills, and micro-domains.
     */
    public function getWorkforceProfile(Request $request, $studioId)
    {
        $studio = Studio::with([
            'users.globalProfile.position',
            'users.globalProfile.skills',
        ])->find($studioId);

        if (! $studio) {
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
        $studio = Studio::with('projects')->find($studioId);
        if (! $studio) {
            return response()->json(['error' => 'Studio not found'], 404);
        }

        $projectIds = $studio->projects->pluck('id')->toArray();

        $tasks = Task::whereIn('project_id', $projectIds)
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
            'active_tasks' => $formattedTasks,
        ]);
    }

    /**
     * Return lean workload data for a specific developer.
     */
    public function getDeveloperWorkload(Request $request, $studioId, $userId)
    {
        $studio = Studio::with('projects')->find($studioId);
        if (! $studio) {
            return response()->json(['error' => 'Studio not found'], 404);
        }

        $projectIds = $studio->projects->pluck('id')->toArray();

        $tasks = Task::whereIn('project_id', $projectIds)
            ->where('assigned_user_id', $userId)
            ->whereIn('status', ['todo', 'in_progress', 'review'])
            ->get(['id', 'title', 'status', 'estimated_hours']);

        $totalEstimatedHours = $tasks->sum('estimated_hours');

        return response()->json([
            'studio_id' => $studioId,
            'user_id' => $userId,
            'active_task_count' => $tasks->count(),
            'total_estimated_hours' => $totalEstimatedHours,
            'tasks' => $tasks,
        ]);
    }
}
