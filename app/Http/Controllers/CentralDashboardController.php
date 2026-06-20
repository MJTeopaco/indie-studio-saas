<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CentralDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // If the user owns a studio, take them straight there.
        $studio = $user->ownedStudios()->first();
        if ($studio) {
            return redirect()->route('tenant.dashboard', ['tenant' => $studio->id]);
        }

        // Otherwise (developer path), show the central dashboard.
        return Inertia::render('Dashboard');
    }
}
