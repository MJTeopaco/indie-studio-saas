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

    Route::get('/projects', [\App\Http\Controllers\TenantProjectController::class, 'index'])
        ->name('tenant.projects.index');

    Route::get('/projects/{project}', [\App\Http\Controllers\TenantProjectController::class, 'show'])
        ->name('tenant.projects.show');

    Route::post('/projects', [\App\Http\Controllers\TenantProjectController::class, 'store'])
        ->name('tenant.projects.store');

});
