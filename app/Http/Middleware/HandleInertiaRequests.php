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

            // Share current workspace role and manage permission status
            'currentUserRole' => function () use ($request) {
                if (!tenant() || !$request->user()) {
                    return null;
                }
                $member = \DB::connection('pgsql')->table('studio_members')
                    ->where('studio_id', tenant('id'))
                    ->where('user_id', $request->user()->id)
                    ->first();
                return $member ? $member->role : 'member';
            },
            'canManage' => function () use ($request) {
                if (!tenant() || !$request->user()) {
                    return false;
                }
                if ($request->user()->role === \App\Models\User::ROLE_ADMIN) {
                    return true;
                }
                $member = \DB::connection('pgsql')->table('studio_members')
                    ->where('studio_id', tenant('id'))
                    ->where('user_id', $request->user()->id)
                    ->first();
                $role = $member ? $member->role : 'member';
                return in_array($role, ['owner', 'leader', 'manager']);
            },
            
            // Share the list of projects for the current workspace
            'workspaceProjects' => function () {
                if (!tenant()) {
                    return [];
                }
                try {
                    return \App\Models\Tenant\Project::select('id', 'name', 'status')->latest()->get()->toArray();
                } catch (\Exception $e) {
                    return [];
                }
            },
        ];
    }
}
