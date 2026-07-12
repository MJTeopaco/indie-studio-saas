<?php

namespace App\Jobs;

use App\Models\Tenant\Project;
use App\Services\MLEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RecomputeProjectSchedule implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $projectId) {}

    /**
     * Execute the job.
     */
    public function handle(MLEngineService $mlService): void
    {
        $project = Project::find($this->projectId);

        if ($project) {
            $mlService->recomputeProjectSchedule($project);
        }
    }
}
