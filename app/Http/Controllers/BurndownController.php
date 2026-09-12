<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\Tenant\TeamVelocity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BurndownController extends Controller
{
    public function index()
    {
        $projects = Project::whereIn('status', ['active', 'planning'])->get();
        
        $burndownData = $projects->map(function ($project) {
            $velocities = TeamVelocity::with('sprint')
                ->where('team_id', $project->id)
                ->orderBy('computed_at', 'asc')
                ->get()
                ->map(fn($v) => [
                    'sprint' => $v->sprint ? $v->sprint->name : 'Unknown Sprint',
                    'velocity' => $v->points_completed,
                ]);

            $totalPoints = Task::where('project_id', $project->id)
                ->where('story_points_locked', true)
                ->sum('story_points');

            $completedPoints = Task::where('project_id', $project->id)
                ->where('story_points_locked', true)
                ->where('status', 'completed')
                ->sum('story_points');

            $remainingPoints = $totalPoints - $completedPoints;

            return [
                'project_id' => $project->id,
                'project_name' => $project->name,
                'total_points' => $totalPoints,
                'completed_points' => $completedPoints,
                'remaining_points' => $remainingPoints,
                'velocities' => $velocities,
            ];
        });

        return Inertia::render('Tenant/Burndown', [
            'burndownData' => $burndownData,
        ]);
    }
}
