<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Tenant\Project;
use Inertia\Inertia;

class TenantOverviewController extends Controller
{
    public function index()
    {
        $studio = Studio::find(tenant('id'));
        $projects = Project::withCount(['projectMembers as members_count', 'tasks'])
            ->with(['tasks.assignee'])
            ->latest()
            ->get()
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'members_count' => $project->members_count,
                'tasks_count' => $project->tasks_count,
                'tasks' => $project->tasks->map(fn($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'es' => $t->es,
                    'ef' => $t->ef,
                    'is_critical' => (bool) $t->is_critical,
                    'assignee' => $t->assignee ? ['name' => $t->assignee->name] : null,
                ])->all(),
            ])
            ->all();

        return Inertia::render('Tenant/Dashboard/Overview', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Pixel Play Studio',
            ],
            'projects' => $projects,
        ]);
    }
}
