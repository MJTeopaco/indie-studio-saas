<?php

use App\Providers\AppServiceProvider;
use App\Providers\ReverbServiceProvider;
use App\Providers\TenancyServiceProvider;
use Laravel\Reverb\ApplicationManagerServiceProvider;

return [
    AppServiceProvider::class,
    TenancyServiceProvider::class,
    ApplicationManagerServiceProvider::class,
    ReverbServiceProvider::class,
];
