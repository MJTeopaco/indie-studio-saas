<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CentralDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // If member belongs to a single studio and is not viewing hub explicitly, route to their studio home
        if (! $request->has('hub') && $user->ownedStudios()->count() === 0 && $user->joinedStudios()->count() === 1) {
            $studio = $user->joinedStudios()->first();

            return redirect()->to("/studio/{$studio->id}/dashboard");
        }

        return Inertia::render('CentralHub', [
            'ownedStudios' => $user->ownedStudios()->withCount('users')->get(['tenants.id', 'tenants.name', 'tenants.created_at']),
            'joinedStudios' => $user->joinedStudios()
                ->where('tenants.owner_id', '!=', $user->id)
                ->withCount('users')
                ->get(['tenants.id', 'tenants.name', 'tenants.created_at']),
        ]);
    }
}
