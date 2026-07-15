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
        $projects = Project::withCount([
                'projectMembers as members_count',
                'tasks',
                'tasks as tasks_done' => fn ($query) => $query->where('status', 'completed'),
                'tasks as tasks_under_review' => fn ($query) => $query->where('status', 'review'),
                'tasks as tasks_active' => fn ($query) => $query->whereIn('status', ['todo', 'in_progress']),
            ])
            ->with(['tasks.assignee'])
            ->latest()
            ->get()
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status,
                'start_date' => $project->start_date ? $project->start_date->toDateString() : null,
                'target_end_date' => $project->target_end_date ? $project->target_end_date->toDateString() : null,
                'computed_status' => $this->computeProjectStatus($project),
                'members_count' => $project->members_count,
                'tasks_count' => $project->tasks_count,
                'tasks_done' => $project->tasks_done,
                'tasks_under_review' => $project->tasks_under_review,
                'tasks_active' => $project->tasks_active,
                'tasks' => $project->tasks->map(fn($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'status' => $t->status,
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

    private function computeProjectStatus(Project $project): string
    {
        if ((int) $project->tasks_count === 0) {
            return $project->status ?? 'planning';
        }

        if ((int) $project->tasks_done === (int) $project->tasks_count) {
            return 'completed';
        }

        if ((int) $project->tasks_under_review > 0) {
            return 'review';
        }

        if ((int) $project->tasks_active > 0) {
            return 'active';
        }

        return $project->status ?? 'planning';
    }
}
