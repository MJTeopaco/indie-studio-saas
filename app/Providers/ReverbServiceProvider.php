<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Reverb\Console\Commands\InstallCommand;
use Laravel\Reverb\Contracts\Logger;
use Laravel\Reverb\Loggers\NullLogger;
use Laravel\Reverb\ServerProviderManager;

class ReverbServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * We intentionally do NOT call Reverb::registerDevCommands() here.
     * The `reverb:start` dev command is registered separately via AppServiceProvider
     * to comply with Laravel's DevCommands restriction.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../../vendor/laravel/reverb/config/reverb.php', 'reverb'
        );

        $this->app->instance(Logger::class, new NullLogger);

        $this->app->singleton(ServerProviderManager::class);

        $this->app->make(ServerProviderManager::class)->register();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands(InstallCommand::class);

            $this->publishes([
                __DIR__.'/../../vendor/laravel/reverb/config/reverb.php' => config_path('reverb.php'),
            ], ['reverb', 'reverb-config']);
        }

        $this->app->make(ServerProviderManager::class)->boot();
    }
}
