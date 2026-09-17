<?php

namespace Tests\Feature;

use App\Models\Tenant\Project;
use App\Models\Tenant\Report;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantDocsTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Project $project;

    protected Sprint $sprint;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Lead Developer',
            'email' => 'lead@test.io',
            'role' => 'admin',
        ]);

        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);

        $this->project = Project::create([
            'name' => 'Project Chimera',
            'description' => 'Cyberpunk action platformer',
            'status' => 'active',
            'start_date' => now()->subDays(10)->toDateString(),
            'target_end_date' => now()->addDays(20)->toDateString(),
        ]);

        $this->sprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 1 - Mechanics',
            'goal' => 'Core movement and combat loops',
            'status' => 'active',
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(9)->toDateString(),
        ]);

        Task::create([
            'project_id' => $this->project->id,
            'sprint_id' => $this->sprint->id,
            'user_id' => $this->user->id,
            'title' => 'Movement controller',
            'status' => 'completed',
            'priority' => 'high',
            'difficulty' => 'hard',
            'story_points' => 5,
            'due_date' => now()->addDays(2),
            'completed_at' => now(),
        ]);
    }

    public function test_can_render_docs_index_with_initial_report_data(): void
    {
        $response = $this->actingAs($this->user)->get(
            route('tenant.docs', ['tenant' => 'test-studio'])
        );

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Tenant/Docs')
            ->has('projects')
            ->has('reports')
            ->has('initialReportData')
        );
    }

    public function test_can_archive_report_from_docs_report_archiving_tab(): void
    {
        $payload = [
            'name' => 'Sprint 1 Archival Report',
            'type' => 'sprint',
            'project_id' => $this->project->id,
            'sprint_id' => $this->sprint->id,
            'scope' => 'sprint',
            'metrics' => [
                'title' => 'Sprint 1 Archival Report',
                'summary' => [
                    'total_tasks' => 1,
                    'completed_tasks' => 1,
                    'completion_rate' => 100,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->post(
            route('tenant.docs.archive', ['tenant' => 'test-studio']),
            $payload,
            ['Accept' => 'application/json']
        );

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('reports', [
            'name' => 'Sprint 1 Archival Report',
            'type' => 'sprint',
            'target_name' => 'Sprint 1 Archival Report',
        ]);
    }

    public function test_can_delete_archived_report(): void
    {
        $report = Report::create([
            'name' => 'Old Archived Report',
            'type' => 'sprint',
            'target_name' => 'Sprint 0',
            'metrics' => ['total_tasks' => 0],
            'created_by' => $this->user->name,
        ]);

        $response = $this->actingAs($this->user)->delete(
            route('tenant.docs.archive.delete', ['tenant' => 'test-studio', 'report' => $report->id])
        );

        $response->assertRedirect();
        $this->assertDatabaseMissing('reports', ['id' => $report->id]);
    }
}
