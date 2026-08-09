<?php

namespace Tests\Feature;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProjectAiAssistantAgentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->actingAs($user);

        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);
    }

    public function test_chat_returns_intent_and_action_payload()
    {
        $project = Project::factory()->create();

        Http::fake([
            '127.0.0.1:8001/api/llm/chat-with-intent' => Http::response([
                'status' => 'success',
                'intent' => 'create_task',
                'confidence' => 0.95,
                'reply' => 'Here is the task I drafted:',
                'action_payload' => [
                    'title' => 'Fix navbar alignment',
                    'objective' => 'Resolve flex alignment issue on mobile screens',
                    'estimated_hours' => 3.5,
                    'priority' => 'High',
                    'task_difficulty' => 'Medium',
                    'task_classification' => 'Bug',
                    'required_skills' => ['React', 'CSS'],
                ],
            ], 200),
        ]);

        $response = $this->postJson(route('tenant.projects.ai-assistant', ['tenant' => 'test', 'project' => $project->id]), [
            'message' => 'Create a task to fix navbar alignment on mobile, 3.5 hours, high priority',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'intent' => 'create_task',
            'reply' => 'Here is the task I drafted:',
            'action_payload' => [
                'title' => 'Fix navbar alignment',
                'estimated_hours' => 3.5,
                'priority' => 'High',
            ],
        ]);
    }

    public function test_execute_action_create_task_creates_task_and_recomputes_schedule()
    {
        $project = Project::factory()->create();

        Http::fake([
            '127.0.0.1:8001/api/schedule/compute' => Http::response([
                'status' => 'success',
                'tasks' => [],
            ], 200),
        ]);

        $response = $this->postJson(route('tenant.projects.ai-assistant.execute-action', ['tenant' => 'test', 'project' => $project->id]), [
            'action' => 'create_task',
            'payload' => [
                'title' => 'Implement Auth Module',
                'objective' => 'Build JWT login flow',
                'estimated_hours' => 12.0,
                'priority' => 'High',
                'task_difficulty' => 'Hard',
                'task_classification' => 'Feature',
                'required_skills' => ['Laravel', 'React'],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'message' => 'Task created successfully and schedule recalculated.',
        ]);

        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'title' => 'Implement Auth Module',
            'estimated_hours' => 12.0,
            'priority' => 'High',
            'task_difficulty' => 'Hard',
            'status' => 'todo',
        ]);
    }
}
