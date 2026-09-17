<?php

declare(strict_types=1);

use App\Http\Controllers\AiChatSessionController;
use App\Http\Controllers\BurndownController;
use App\Http\Controllers\ChannelMessageController;
use App\Http\Controllers\EpicAttributeController;
use App\Http\Controllers\EstimationController;
use App\Http\Controllers\MLEngineIntegrationController;
use App\Http\Controllers\TenantDashboardController;
use App\Http\Controllers\TenantDocsController;
use App\Http\Controllers\TenantEpicGroupController;
use App\Http\Controllers\TenantOverviewController;
use App\Http\Controllers\TenantProjectController;
use App\Http\Controllers\TenantReportController;
use App\Http\Controllers\TenantScheduleController;
use App\Http\Controllers\TenantTaskController;
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

    // Alias: members can bookmark /my-work and land on their member dashboard
    Route::get('/my-work', [TenantDashboardController::class, 'index'])
        ->name('tenant.my-work');

    Route::get('/inbox', [TenantDashboardController::class, 'inbox'])
        ->name('tenant.inbox');
    Route::post('/notifications/read-all', [TenantDashboardController::class, 'markAllNotificationsRead'])
        ->name('tenant.notifications.read-all');
    Route::post('/notifications/{id}/read', [TenantDashboardController::class, 'markNotificationRead'])
        ->name('tenant.notifications.read');

    Route::get('/overview', [TenantOverviewController::class, 'index'])
        ->name('tenant.overview');

    Route::get('/tasks', [TenantTaskController::class, 'index'])
        ->name('tenant.tasks');

    Route::patch('/tasks/{task}/status', [TenantTaskController::class, 'updateStatus'])
        ->name('tenant.tasks.update-status');

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

    Route::post('/projects/{project}/epic-groups', [TenantEpicGroupController::class, 'store'])
        ->name('tenant.projects.epic-groups.store');

    Route::post('/projects/{project}/epics', [TenantProjectController::class, 'storeEpic'])
        ->name('tenant.projects.epics.store');

    Route::patch('/projects/{project}/epics/{epic}', [TenantProjectController::class, 'updateEpic'])
        ->name('tenant.projects.epics.update');

    Route::post('/projects/{project}/epic-attributes', [EpicAttributeController::class, 'store'])
        ->name('tenant.projects.epic-attributes.store');

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

    // Reports & Analytics Hub
    Route::get('/reports', [TenantReportController::class, 'index'])->name('tenant.reports');
    Route::get('/reports/data', [TenantReportController::class, 'getReportData'])->name('tenant.reports.data');
    Route::post('/reports/share-email', [TenantReportController::class, 'shareEmail'])->name('tenant.reports.share-email');
    Route::post('/reports/share-chat', [TenantReportController::class, 'shareChat'])->name('tenant.reports.share-chat');
    Route::get('/reports/export-csv', [TenantReportController::class, 'exportCsv'])->name('tenant.reports.export-csv');

    // Project Task Bulk Save Route
    Route::post('/projects/{project}/tasks/bulk', [TenantProjectController::class, 'storeBulkTasks'])
        ->name('tenant.projects.tasks.bulk');
    Route::post('/projects/{project}/hierarchy/bulk', [TenantProjectController::class, 'storeBulkHierarchy'])
        ->name('tenant.projects.hierarchy.bulk');
    Route::post('/projects/{project}/tasks', [TenantProjectController::class, 'storeTask'])
        ->name('tenant.projects.tasks.store');
    Route::patch('/projects/{project}/tasks/{task}', [TenantProjectController::class, 'updateTask'])
        ->name('tenant.projects.tasks.update');

    // Sprints
    Route::post('/projects/{project}/sprints', [TenantProjectController::class, 'storeSprint'])
        ->name('tenant.projects.sprints.store');
    Route::get('/projects/{project}/sprints/{sprint}/summary', [TenantProjectController::class, 'getSprintSummary'])
        ->name('tenant.projects.sprints.summary');
    Route::patch('/projects/{project}/sprints/{sprint}', [TenantProjectController::class, 'updateSprintStatus'])
        ->name('tenant.projects.sprints.update');
    Route::patch('/projects/{project}/sprints/{sprint}/details', [TenantProjectController::class, 'updateSprint'])
        ->name('tenant.projects.sprints.update-details');
    Route::patch('/projects/{project}/tasks/{task}/inline', [TenantProjectController::class, 'updateTaskInline'])
        ->name('tenant.projects.tasks.inline-update');

    // ML Engine Integration Routes
    Route::post('/projects/{project}/ml/sprint-decompose', [MLEngineIntegrationController::class, 'decomposeSprint'])
        ->name('tenant.ml.decompose');
    Route::post('/projects/{project}/ml/compute-schedule', [MLEngineIntegrationController::class, 'computeSchedule'])
        ->name('tenant.ml.schedule');
    Route::post('/projects/{project}/ai-assistant', [MLEngineIntegrationController::class, 'projectAssistant'])
        ->name('tenant.projects.ai-assistant');
    Route::post('/projects/{project}/ai-assistant/execute-action', [MLEngineIntegrationController::class, 'executeProjectAction'])
        ->name('tenant.projects.ai-assistant.execute-action');
    Route::post('/ai-router', [MLEngineIntegrationController::class, 'routeIntent'])
        ->name('tenant.workspace.ai-router');
    Route::post('/ai-assistant', [MLEngineIntegrationController::class, 'workspaceAssistant'])
        ->name('tenant.workspace.ai-assistant');
    Route::post('/ai/decompose-project', [MLEngineIntegrationController::class, 'decomposeWorkspaceProject'])
        ->name('tenant.workspace.decompose');
    Route::post('/ai/decompose-project/hierarchical', [MLEngineIntegrationController::class, 'decomposeWorkspaceProjectHierarchical'])
        ->name('tenant.workspace.decompose-hierarchical');
    Route::post('/tasks/{task}/ml/best-fit', [MLEngineIntegrationController::class, 'bestFit'])
        ->name('tenant.ml.best-fit');
    Route::post('/tasks/{task}/assign', [MLEngineIntegrationController::class, 'assignTask'])
        ->name('tenant.tasks.assign');
    // Preview best-fit for draft (unsaved) tasks during sprint planning review
    Route::post('/ml/preview-best-fit', [MLEngineIntegrationController::class, 'previewBestFit'])
        ->name('tenant.ml.preview-best-fit');

    // Estimation & Velocity Routes
    Route::get('/estimates/pending', [EstimationController::class, 'pendingQueue'])->name('tenant.estimates.pending');
    Route::post('/tasks/{task}/estimates', [EstimationController::class, 'submitEstimate'])->name('tenant.estimates.submit');
    Route::get('/estimates/needs-review', [EstimationController::class, 'reviewQueue'])->name('tenant.estimates.review');
    Route::post('/tasks/{task}/estimates/resolve', [EstimationController::class, 'resolveEstimate'])->name('tenant.estimates.resolve');

    // Phase 6 Burndown Dashboard
    Route::get('/burndown', [BurndownController::class, 'index'])->name('tenant.burndown');

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

    // Channel Messaging (real-time via polling)
    Route::get('/channels-activity', [ChannelMessageController::class, 'activity'])
        ->name('tenant.channels.activity');
    Route::get('/channels/{channelId}/messages', [ChannelMessageController::class, 'index'])
        ->name('tenant.channels.messages.index')
        ->where('channelId', '[\w-]+');
    Route::post('/channels/{channelId}/messages', [ChannelMessageController::class, 'store'])
        ->name('tenant.channels.messages.store')
        ->where('channelId', '[\w-]+');
    Route::delete('/channels/{channelId}/messages/{message}', [ChannelMessageController::class, 'destroy'])
        ->name('tenant.channels.messages.destroy')
        ->where('channelId', '[\w-]+')
        ->where('message', '[0-9]+');
    Route::post('/channels/{channelId}/messages/{message}/pin', [ChannelMessageController::class, 'togglePin'])
        ->name('tenant.channels.messages.pin')
        ->where('channelId', '[\w-]+')
        ->where('message', '[0-9]+');
    Route::get('/channels/{channelId}/assets', [ChannelMessageController::class, 'assets'])
        ->name('tenant.channels.assets')
        ->where('channelId', '[\w-]+');
    Route::post('/channels/{channelId}/email', [ChannelMessageController::class, 'emailMessage'])
        ->name('tenant.channels.messages.email')
        ->where('channelId', '[\w-]+');
    Route::post('/channels/{channelId}/read', [ChannelMessageController::class, 'markRead'])
        ->name('tenant.channels.read')
        ->where('channelId', '[\w-]+');

    // Secure tenant attachments serving (photos, files, documents)
    Route::get('/attachments/{path}', [ChannelMessageController::class, 'downloadAttachment'])
        ->name('tenant.attachments.show')
        ->where('path', '.*');

});
