<?php

use App\Http\Controllers\InternalDataController;
use Illuminate\Support\Facades\Route;

Route::middleware(['ml.auth'])->prefix('internal')->group(function () {
    Route::get('/studios/{studio_id}/workforce-profile', [InternalDataController::class, 'getWorkforceProfile']);
    Route::get('/studios/{studio_id}/sprint-health', [InternalDataController::class, 'getSprintHealth']);
    Route::get('/studios/{studio_id}/developers/{user_id}/workload', [InternalDataController::class, 'getDeveloperWorkload']);
});
