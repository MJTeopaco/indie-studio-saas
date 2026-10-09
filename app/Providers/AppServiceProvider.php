<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use App\Models\Tenant\Task;
use App\Observers\TaskObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Task::observe(TaskObserver::class);

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);
    }
}
