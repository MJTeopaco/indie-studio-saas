<?php

namespace App\Console\Commands;

use App\Http\Controllers\EstimationController;
use App\Models\Tenant\Task;
use Illuminate\Console\Command;

class LockExpiredEstimates extends Command
{
    protected $signature = 'estimates:lock-expired';
    protected $description = 'Lock estimates that have passed their grace period (UTC midnight).';

    public function handle(EstimationController $estimationController)
    {
        // Run across all tenants
        tenancy()->runForMultiple(null, function ($tenant) use ($estimationController) {
            $this->info("Processing tenant: {$tenant->id}");
            
            // Grace period: end of creation day UTC. 
            // If created_at < start of today, the grace period has passed.
            $cutoff = now()->startOfDay();
            
            $expiredTasks = Task::where('story_points_locked', false)
                ->where('needs_estimate_review', false)
                ->where('created_at', '<', $cutoff)
                ->with('estimateSubmissions')
                ->get();
                
            foreach ($expiredTasks as $task) {
                $submissions = $task->estimateSubmissions->pluck('submitted_points')->toArray();
                $estimationController->evaluateSubmissions($task, $submissions);
                $this->info("Evaluated task {$task->id} with " . count($submissions) . " submissions.");
            }
        });
    }
}
