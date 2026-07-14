<?php

declare(strict_types=1);

use App\Http\Controllers\MLEngineIntegrationController;
use App\Http\Controllers\TenantDashboardController;
use App\Http\Controllers\TenantProjectController;
use App\Http\Controllers\TenantTeamController;
use App\Http\Controllers\TenantTaskController;
use App\Http\Controllers\TenantOverviewController;
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

    Route::get('/overview', [TenantOverviewController::class, 'index'])
        ->name('tenant.overview');

    Route::get('/tasks', [TenantTaskController::class, 'index'])
        ->name('tenant.tasks');

    Route::get('/schedule', function () {
        return \Inertia\Inertia::render('Tenant/Schedule/Index');
    })->name('tenant.schedule');

    Route::get('/automation', function () {
        return \Inertia\Inertia::render('Tenant/Placeholder', [
            'title' => 'Agentic Automation Hub',
            'description' => 'Orchestrate automated developer assignment, branch creation, code reviews, and deployment triggers with Vaultera Labs AI agents.',
            'status' => 'Agent Core Offline'
        ]);
    })->name('tenant.automation');

    Route::get('/team', [TenantTeamController::class, 'index'])
        ->name('tenant.team');

    Route::get('/projects', [TenantProjectController::class, 'index'])
        ->name('tenant.projects.index');

    Route::get('/projects/{project}', [TenantProjectController::class, 'show'])
        ->name('tenant.projects.show');

    Route::post('/projects', [TenantProjectController::class, 'store'])
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

    // Project Task Bulk Save Route
    Route::post('/projects/{project}/tasks/bulk', [TenantProjectController::class, 'storeBulkTasks'])
        ->name('tenant.projects.tasks.bulk');
    Route::post('/projects/{project}/tasks', [TenantProjectController::class, 'storeTask'])
        ->name('tenant.projects.tasks.store');
    Route::patch('/projects/{project}/tasks/{task}', [TenantProjectController::class, 'updateTask'])
        ->name('tenant.projects.tasks.update');

    // ML Engine Integration Routes
    Route::post('/projects/{project}/ml/sprint-decompose', [MLEngineIntegrationController::class, 'decomposeSprint'])
        ->name('tenant.ml.decompose');
    Route::post('/projects/{project}/ml/compute-schedule', [MLEngineIntegrationController::class, 'computeSchedule'])
        ->name('tenant.ml.schedule');
    Route::post('/projects/{project}/ai-assistant', [MLEngineIntegrationController::class, 'projectAssistant'])
        ->name('tenant.projects.ai-assistant');
    Route::post('/ai-assistant', [MLEngineIntegrationController::class, 'workspaceAssistant'])
        ->name('tenant.workspace.ai-assistant');
    Route::post('/ai/decompose-project', [MLEngineIntegrationController::class, 'decomposeWorkspaceProject'])
        ->name('tenant.workspace.decompose');
    Route::post('/tasks/{task}/ml/best-fit', [MLEngineIntegrationController::class, 'bestFit'])
        ->name('tenant.ml.best-fit');
    Route::post('/tasks/{task}/assign', [MLEngineIntegrationController::class, 'assignTask'])
        ->name('tenant.tasks.assign');

});
