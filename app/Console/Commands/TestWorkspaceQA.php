<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Request;
use App\Models\Studio;
use App\Models\User;
use App\Http\Controllers\MLEngineIntegrationController;

class TestWorkspaceQA extends Command
{
    protected $signature = 'test:qa';

    public function handle()
    {
        $request = Request::create('/api/ai-assistant', 'POST', [
            'message' => 'Goal: Analyze the health and timeline of the current active sprint. Context: Evaluate the task dependencies and estimated hours using our Critical Path logic. Requirements: 1. Identify any bottlenecks or tasks with zero total float that could delay the sprint. 2. Flag any developers who are over-allocated based on the earliest start/latest finish times. 3. Suggest actionable schedule adjustments to ensure we hit our delivery deadline.',
            'project_id' => 1
        ]);
        
        $studio = Studio::find('indiecraft-studios');
        tenancy()->initialize($studio);
        $user = User::first();
        auth()->login($user);

        $controller = app(MLEngineIntegrationController::class);
        $response = $controller->workspaceAssistant($request);
        
        echo $response->getContent() . "\n";
    }
}
