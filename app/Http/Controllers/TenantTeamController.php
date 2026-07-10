<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantTeamController extends Controller
{
    /**
     * Show the Team Overview for the active tenant (studio).
     */
    public function index(): Response
    {
        $studio = Studio::with('users.globalProfile.position')->find(tenant('id'));
        $studioName = $studio ? $studio->name : 'Studio';

        $members = collect();
        if ($studio && $studio->users) {
            $members = $studio->users->map(function ($user) {
                $role = $user->pivot ? $user->pivot->role : 'member';
                $position = $user->globalProfile && $user->globalProfile->position 
                    ? $user->globalProfile->position->name 
                    : ($user->role === 'admin' ? 'Project Lead' : 'Developer');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role,
                    'position' => $position,
                    'joined_at' => $user->pivot && $user->pivot->created_at 
                        ? $user->pivot->created_at->format('M d, Y') 
                        : $user->created_at->format('M d, Y'),
                ];
            });
        }

        // Query the logged-in user's role inside the active studio from the central database
        $currentUserMember = \DB::connection('pgsql')
            ->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', auth()->id())
            ->first();

        $currentUserRole = $currentUserMember ? $currentUserMember->role : 'member';

        // Set canManage true if they are owner, team leader, manager, or global platform admin
        $canManage = in_array($currentUserRole, ['owner', 'leader', 'manager'])
            || (auth()->check() && auth()->user()->role === \App\Models\User::ROLE_ADMIN);

        return Inertia::render('Tenant/Team/Index', [
            'studio' => [
                'id' => tenant('id'),
                'name' => $studioName,
            ],
            'members' => $members,
            'canManage' => $canManage,
        ]);
    }
}
