<?php

namespace App\Http\Controllers;

use App\Models\Studio;
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
            $projects = \App\Models\Tenant\Project::withCount(['projectMembers as members_count', 'tasks'])
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
                    ];
                });
        } catch (\Exception $e) {
            $projects = [];
        }

        return Inertia::render('Tenant/Dashboard', [
            'studio' => [
                'id'   => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'projects' => $projects,
        ]);
    }
}
