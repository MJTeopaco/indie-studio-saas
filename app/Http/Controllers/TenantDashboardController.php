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

        return Inertia::render('Tenant/Dashboard', [
            'studio' => [
                'id'   => $studio->id,
                'name' => $studio->name,
            ],
        ]);
    }
}
