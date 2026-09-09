<?php

declare(strict_types=1);

use App\Http\Controllers\AiChatSessionController;
use App\Http\Controllers\MLEngineIntegrationController;
use App\Http\Controllers\TenantDashboardController;
use App\Http\Controllers\TenantOverviewController;
use App\Http\Controllers\TenantDocsController;
use App\Http\Controllers\TenantProjectController;
use App\Http\Controllers\TenantScheduleController;
use App\Http\Controllers\TenantTaskController;
use App\Http\Controllers\EstimationController;
use App\Http\Controllers\TenantTeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
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

    Route::get('/schedule', [TenantScheduleController::class, 'index'])
        ->name('tenant.schedule');

    Route::get('/automation', function () {
        return Inertia::render('Tenant/Placeholder', [
            'title' => 'Agentic Automation Hub',
            'description' => 'Orchestrate automated developer assignment, branch creation, code reviews, and deployment triggers with Vaultera Labs AI agents.',
            'status' => 'Agent Core Offline',
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

    Route::patch('/projects/{project}', [TenantProjectController::class, 'update'])
        ->name('tenant.projects.update');

    Route::get('/settings', function () {
        return Inertia::render('Tenant/Placeholder', [
            'title' => 'Studio Settings',
            'description' => 'Configure workspace details, developer roles, division integrations, and default GNN model thresholds.',
            'status' => 'Active Configuration',
        ]);
    })->name('tenant.settings');

    Route::get('/docs', [TenantDocsController::class, 'index'])->name('tenant.docs');
    Route::post('/docs/archive', [TenantDocsController::class, 'archive'])->name('tenant.docs.archive');
    Route::delete('/docs/archive/{report}', [TenantDocsController::class, 'deleteReport'])->name('tenant.docs.archive.delete');

    // Project Task Bulk Save Route
    Route::post('/projects/{project}/tasks/bulk', [TenantProjectController::class, 'storeBulkTasks'])
        ->name('tenant.projects.tasks.bulk');
    Route::post('/projects/{project}/tasks', [TenantProjectController::class, 'storeTask'])
        ->name('tenant.projects.tasks.store');
    Route::patch('/projects/{project}/tasks/{task}', [TenantProjectController::class, 'updateTask'])
        ->name('tenant.projects.tasks.update');

    // Sprints
    Route::post('/projects/{project}/sprints', [TenantProjectController::class, 'storeSprint'])
        ->name('tenant.projects.sprints.store');

    // ML Engine Integration Routes
    Route::post('/projects/{project}/ml/sprint-decompose', [MLEngineIntegrationController::class, 'decomposeSprint'])
        ->name('tenant.ml.decompose');
    Route::post('/projects/{project}/ml/compute-schedule', [MLEngineIntegrationController::class, 'computeSchedule'])
        ->name('tenant.ml.schedule');
    Route::post('/projects/{project}/ai-assistant', [MLEngineIntegrationController::class, 'projectAssistant'])
        ->name('tenant.projects.ai-assistant');
    Route::post('/projects/{project}/ai-assistant/execute-action', [MLEngineIntegrationController::class, 'executeProjectAction'])
        ->name('tenant.projects.ai-assistant.execute-action');
    Route::post('/ai-assistant', [MLEngineIntegrationController::class, 'workspaceAssistant'])
        ->name('tenant.workspace.ai-assistant');
    Route::post('/ai/decompose-project', [MLEngineIntegrationController::class, 'decomposeWorkspaceProject'])
        ->name('tenant.workspace.decompose');
    Route::post('/tasks/{task}/ml/best-fit', [MLEngineIntegrationController::class, 'bestFit'])
        ->name('tenant.ml.best-fit');
    Route::post('/tasks/{task}/assign', [MLEngineIntegrationController::class, 'assignTask'])
        ->name('tenant.tasks.assign');
    // Preview best-fit for draft (unsaved) tasks during sprint planning review
    Route::post('/ml/preview-best-fit', [MLEngineIntegrationController::class, 'previewBestFit'])
        ->name('tenant.ml.preview-best-fit');

    // Estimation & Velocity Routes
    Route::get('/estimates/pending', [\App\Http\Controllers\EstimationController::class, 'pendingQueue'])->name('tenant.estimates.pending');
    Route::post('/tasks/{task}/estimates', [\App\Http\Controllers\EstimationController::class, 'submitEstimate'])->name('tenant.estimates.submit');
    Route::get('/estimates/needs-review', [\App\Http\Controllers\EstimationController::class, 'reviewQueue'])->name('tenant.estimates.review');
    Route::post('/tasks/{task}/estimates/resolve', [\App\Http\Controllers\EstimationController::class, 'resolveEstimate'])->name('tenant.estimates.resolve');

    // Phase 6 Burndown Dashboard
    Route::get('/burndown', [\App\Http\Controllers\BurndownController::class, 'index'])->name('tenant.burndown');

    // AI Chat Session History
    Route::get('/chats', [AiChatSessionController::class, 'index'])
        ->name('tenant.chats.index');
    Route::post('/chats', [AiChatSessionController::class, 'store'])
        ->name('tenant.chats.store');
    Route::get('/chats/{chatSession}', [AiChatSessionController::class, 'show'])
        ->name('tenant.chats.show');
    Route::patch('/chats/{chatSession}', [AiChatSessionController::class, 'update'])
        ->name('tenant.chats.update');
    Route::delete('/chats/{chatSession}', [AiChatSessionController::class, 'destroy'])
        ->name('tenant.chats.destroy');

});
