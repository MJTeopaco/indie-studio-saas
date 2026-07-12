<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // Provides the active studio UUID to all React pages.
            // null on central pages; UUID string on /studio/{tenant}/... pages.
            'activeWorkspace' => tenant('id'),
            
            // Share the list of projects for the current workspace
            'workspaceProjects' => function () {
                if (!tenant()) {
                    return [];
                }
                try {
                    $projects = \App\Models\Tenant\Project::select('id', 'name', 'status')->latest()->get()->toArray();
                    if (empty($projects)) {
                        return [
                            ['id' => 1, 'name' => 'Lumora: E-commerce website', 'status' => 'planning'],
                            ['id' => 2, 'name' => 'StudioSprint AI Recommendations Engine', 'status' => 'active'],
                        ];
                    }
                    return $projects;
                } catch (\Exception $e) {
                    return [
                        ['id' => 1, 'name' => 'Lumora: E-commerce website', 'status' => 'planning'],
                        ['id' => 2, 'name' => 'StudioSprint AI Recommendations Engine', 'status' => 'active'],
                    ];
                }
            },
        ];
    }
}
