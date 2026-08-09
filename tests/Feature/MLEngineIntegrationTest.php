<?php

namespace Tests\Feature;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MLEngineIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user
        $user = User::factory()->create();
        $this->actingAs($user);

        // Disable tenancy middleware so it doesn't try to migrate SQLite :memory: databases
        $this->withoutMiddleware();

        // Manually run tenant migrations on the SQLite in-memory database
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);
    }

    public function test_decompose_sprint_route()
    {
        Http::fake([
            '127.0.0.1:8001/api/llm/decompose-project' => Http::response([
                'status' => 'success',
                'tasks' => [
                    ['title' => 'Design API', 'description' => 'Draft the schema'],
                ],
            ], 200),
        ]);

        $project = Project::factory()->create();

        // Pass 'test' as the tenant slug in the route
        $response = $this->postJson(route('tenant.ml.decompose', ['tenant' => 'test', 'project' => $project->id]), [
            'description' => 'We need to design a REST API.',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'tasks' => [
                ['title' => 'Design API', 'description' => 'Draft the schema'],
            ],
        ]);
    }

    public function test_compute_schedule_route_updates_tasks()
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'estimated_hours' => 10]);

        Http::fake([
            '127.0.0.1:8001/api/schedule/compute' => Http::response([
                'status' => 'success',
                'tasks' => [
                    [
                        'id' => $task->id,
                        'es' => 0.0,
                        'ef' => 10.0,
                        'ls' => 0.0,
                        'lf' => 10.0,
                        'total_float' => 0.0,
                        'is_critical' => true,
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson(route('tenant.ml.schedule', ['tenant' => 'test', 'project' => $project->id]));

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'is_critical' => true,
            'ef' => 10.0,
        ]);
    }

    public function test_best_fit_route()
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id, 'es' => 0.0, 'ef' => 10.0, 'is_critical' => true, 'total_float' => 0.0]);

        Http::fake([
            '127.0.0.1:8001/api/best-fit' => Http::response([
                'status' => 'success',
                'results' => [
                    ['user_id' => 101, 'match_fit_score' => 0.95],
                ],
            ], 200),
            '127.0.0.1:8001/api/llm/synthesize-assignment' => Http::response([
                'status' => 'success',
                'explanation' => 'User 101 is a great fit.',
            ], 200),
        ]);

        $response = $this->postJson(route('tenant.ml.best-fit', ['tenant' => 'test', 'task' => $task->id]));

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'explanation' => 'User 101 is a great fit.',
            'results' => [
                ['user_id' => 101, 'match_fit_score' => 0.95],
            ],
        ]);
    }
}
