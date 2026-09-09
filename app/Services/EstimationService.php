<?php

namespace App\Services;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\Tenant\TeamVelocity;

class EstimationService
{
    /**
     * Compute the velocity for all active projects.
     */
    public function computeProjectVelocities()
    {
        $projects = Project::whereIn('status', ['active', 'planning'])->get();

        foreach ($projects as $project) {
            $startDate = $project->start_date ?? $project->created_at;
            if (!$startDate) continue;

            $daysDiff = now()->diffInDays($startDate);
            $sprintNumber = floor($daysDiff / 14) + 1;
            $sprintLabel = "Sprint {$sprintNumber}";

            $sprintStart = $startDate->copy()->addDays(($sprintNumber - 1) * 14);
            $sprintEnd = $sprintStart->copy()->addDays(14);

            // Calculate completed points
            $completedPoints = Task::where('project_id', $project->id)
                ->where('status', 'completed')
                ->where('story_points_locked', true)
                ->whereBetween('updated_at', [$sprintStart, $sprintEnd])
                ->sum('story_points');

            // Find committed points (all tasks locked and created/assigned before or during this sprint)
            // For MVP approximation, we'll just sum all locked points assigned to this sprint window.
            // Since we don't have sprint assignment, we'll just track completed points as velocity.

            TeamVelocity::updateOrCreate(
                ['team_id' => $project->id, 'sprint_label' => $sprintLabel],
                [
                    'points_completed' => $completedPoints,
                    'computed_at' => now(),
                ]
            );

            // Re-derive durations for all locked tasks in this project
            $this->deriveDurationsForProject($project);
        }
    }

    /**
     * Derive PERT durations (optimistic, likely, pessimistic) in hours 
     * based on project velocity and task story points.
     */
    public function deriveDurationsForProject(Project $project)
    {
        // Calculate average velocity across all sprints for this project
        $averageVelocity = TeamVelocity::where('team_id', $project->id)
            ->where('points_completed', '>', 0)
            ->avg('points_completed');

        // Default velocity: 10 points per 2-week sprint (80 working hours) => 1 point = 8 hours
        if (!$averageVelocity || $averageVelocity <= 0) {
            $averageVelocity = 10;
        }

        // hours per point = 80 hours / velocity
        $hoursPerPoint = 80 / $averageVelocity;

        $tasks = Task::where('project_id', $project->id)
            ->where('story_points_locked', true)
            ->whereIn('status', ['todo', 'in_progress', 'review'])
            ->get();

        foreach ($tasks as $task) {
            if (!$task->story_points) continue;

            $likelyHours = $task->story_points * $hoursPerPoint;
            
            // Standard variance +/- 20% for PERT
            $optimisticHours = $likelyHours * 0.8;
            $pessimisticHours = $likelyHours * 1.5; // Pessimistic usually has a longer tail

            $task->update([
                'duration_likely' => round($likelyHours, 2),
                'duration_optimistic' => round($optimisticHours, 2),
                'duration_pessimistic' => round($pessimisticHours, 2),
            ]);
        }
    }
    
    /**
     * Derive duration for a single task.
     */
    public function deriveDurationForTask(Task $task)
    {
        if (!$task->story_points_locked || !$task->story_points || !$task->project_id) return;
        
        $project = Project::find($task->project_id);
        if ($project) {
            $this->deriveDurationsForProject($project);
        }
    }
}
