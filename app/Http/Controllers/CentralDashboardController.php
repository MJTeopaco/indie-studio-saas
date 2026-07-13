<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CentralDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Dashboard', [
            'ownedStudios'  => $user->ownedStudios()->withCount('users')->get(['tenants.id', 'tenants.name', 'tenants.created_at']),
            'joinedStudios' => $user->joinedStudios()
                                    ->where('tenants.owner_id', '!=', $user->id)
                                    ->withCount('users')
                                    ->get(['tenants.id', 'tenants.name', 'tenants.created_at']),
        ]);
    }
}
