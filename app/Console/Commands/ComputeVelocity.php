<?php

namespace App\Console\Commands;

use App\Services\EstimationService;
use Illuminate\Console\Command;

class ComputeVelocity extends Command
{
    protected $signature = 'estimates:compute-velocity';
    protected $description = 'Compute team velocity and derive task durations (Phase 3 & 4).';

    public function handle(EstimationService $estimationService)
    {
        tenancy()->runForMultiple(null, function ($tenant) use ($estimationService) {
            $this->info("Computing velocity for tenant: {$tenant->id}");
            $estimationService->computeProjectVelocities();
            $this->info("Completed velocity computation for tenant: {$tenant->id}");
        });
    }
}
