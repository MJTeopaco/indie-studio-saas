<?php

declare(strict_types=1);

use App\Http\Controllers\TenantDashboardController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

/*
|--------------------------------------------------------------------------
| Tenant Routes (Path-Based)
|--------------------------------------------------------------------------
|
| All tenant routes are prefixed with /studio/{tenant} where {tenant} is
| the studio's unique ID (slug). This works with php artisan serve and
| requires no special DNS, Herd, or web server configuration.
|
*/

Route::prefix('/studio/{tenant}')->middleware([
    'web',
    InitializeTenancyByPath::class,
    'auth',
])->group(function () {

    Route::get('/dashboard', [TenantDashboardController::class, 'index'])
        ->name('tenant.dashboard');

    Route::get('/overview', function () {
        return \Inertia\Inertia::render('Tenant/Dashboard/Overview');
    })->name('tenant.overview');

    Route::get('/tasks', function () {
        return \Inertia\Inertia::render('Tenant/Tasks/Index');
    })->name('tenant.tasks');

    Route::get('/schedule', function () {
        return \Inertia\Inertia::render('Tenant/Placeholder', [
            'title' => 'Studio Schedule & Timelines',
            'description' => 'Manage active sprints, developer allocations, and division release dates. Automatically synchronized with member availability.',
            'status' => 'Calendar Sync Pending'
        ]);
    })->name('tenant.schedule');

    Route::get('/automation', function () {
        return \Inertia\Inertia::render('Tenant/Placeholder', [
            'title' => 'Agentic Automation Hub',
            'description' => 'Orchestrate automated developer assignment, branch creation, code reviews, and deployment triggers with Vaultera Labs AI agents.',
            'status' => 'Agent Core Offline'
        ]);
    })->name('tenant.automation');

    Route::get('/team', [\App\Http\Controllers\TenantTeamController::class, 'index'])
        ->name('tenant.team');

    Route::get('/projects', [\App\Http\Controllers\TenantProjectController::class, 'index'])
        ->name('tenant.projects.index');

    Route::get('/projects/{project}', [\App\Http\Controllers\TenantProjectController::class, 'show'])
        ->name('tenant.projects.show');

    Route::post('/projects', [\App\Http\Controllers\TenantProjectController::class, 'store'])
        ->name('tenant.projects.store');

    Route::get('/settings', function () {
        return \Inertia\Inertia::render('Tenant/Placeholder', [
            'title' => 'Studio Settings',
            'description' => 'Configure workspace details, developer roles, division integrations, and default GNN model thresholds.',
            'status' => 'Active Configuration'
        ]);
    })->name('tenant.settings');

    Route::get('/docs', function () {
        return \Inertia\Inertia::render('Tenant/Placeholder', [
            'title' => 'Developer Documentation',
            'description' => 'Read StudioSprint developer handbook, internal platform architecture specs, and division onboarding playbooks.',
            'status' => 'V1.0 Documentation Published'
        ]);
    })->name('tenant.docs');

});
