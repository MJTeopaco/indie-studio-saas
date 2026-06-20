<?php

use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::middleware(['auth', 'verified', 'requires.onboarding'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\CentralDashboardController::class, 'index'])->name('dashboard');
});

Route::middleware('auth')->group(function () {
    // Onboarding
    Route::get('/onboarding/fork', [OnboardingController::class, 'fork'])->name('onboarding.fork');
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
    
    Route::post('/onboarding/studio', [OnboardingController::class, 'createStudio'])->name('onboarding.studio.store');
    Route::post('/onboarding/join', [OnboardingController::class, 'joinStudio'])->name('onboarding.join.store');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
