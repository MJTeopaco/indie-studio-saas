<?php

namespace Tests\Feature;

use App\Jobs\RecomputeProjectSchedule;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ProjectTaskWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create(['role' => User::ROLE_ADMIN]);
        \DB::table('studio_members')->insert([
            'studio_id' => 'test',
            'user_id' => $user->id,
            'role' => 'owner',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->actingAs($user);
        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);
    }

    public function test_manual_task_creation_queues_schedule_recalculation(): void
    {
        Queue::fake();
        $project = Project::factory()->create();

        $response = $this->post(route('tenant.projects.tasks.store', ['tenant' => 'test', 'project' => $project->id]), [
            'title' => 'Update studio logo',
            'description' => 'Replace the logo in the header.',
            'estimated_hours' => 2,
            'priority' => 'Medium',
            'status' => 'todo',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'title' => 'Update studio logo',
            'estimated_hours' => 2,
        ]);
        Queue::assertPushed(RecomputeProjectSchedule::class, fn (RecomputeProjectSchedule $job) => $job->projectId === $project->id);
    }

    public function test_task_update_replaces_dependencies_and_queues_recalculation(): void
    {
        Queue::fake();
        $project = Project::factory()->create();
        $predecessor = Task::factory()->create(['project_id' => $project->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'estimated_hours' => 2]);

        $response = $this->patch(route('tenant.projects.tasks.update', ['tenant' => 'test', 'project' => $project->id, 'task' => $task->id]), [
            'estimated_hours' => 8,
            'depends_on' => [$predecessor->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'estimated_hours' => 8]);
        $this->assertDatabaseHas('task_dependencies', ['task_id' => $task->id, 'depends_on_task_id' => $predecessor->id]);
        Queue::assertPushed(RecomputeProjectSchedule::class, fn (RecomputeProjectSchedule $job) => $job->projectId === $project->id);
    }

    public function test_task_assignment_persists_the_selected_team_member(): void
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);
        $assignee = User::factory()->create(['name' => 'Avery Chen']);

        $response = $this->postJson(route('tenant.tasks.assign', ['tenant' => 'test', 'task' => $task->id]), [
            'employee_user_id' => $assignee->id,
            'match_fit_score' => 0.92,
            'assigned_by' => 'manual',
        ]);

        $response->assertOk()
            ->assertJsonPath('task_id', $task->id)
            ->assertJsonPath('assignees.0.name', 'Avery Chen');

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'assigned_user_id' => $assignee->id]);
        $this->assertDatabaseHas('assignments', ['task_id' => $task->id, 'employee_user_id' => $assignee->id, 'status' => 'active']);
    }

    public function test_bulk_task_save_uses_the_project_route_parameter_and_queues_schedule_recalculation(): void
    {
        Queue::fake();
        $project = Project::factory()->create();

        $response = $this->postJson(route('tenant.projects.tasks.bulk', ['tenant' => 'test', 'project' => $project->id]), [
            'tasks' => [[
                'id' => 'draft-1',
                'title' => 'Build storefront',
                'estimated_hours' => 12,
                'priority' => 'High',
                'days_until_deadline' => 240,
            ]],
        ]);

        $response->assertOk()->assertJsonPath('status', 'success');
        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'title' => 'Build storefront',
            'days_until_deadline' => 240,
        ]);
        Queue::assertPushed(RecomputeProjectSchedule::class, fn (RecomputeProjectSchedule $job) => $job->projectId === $project->id);

        $this->get(route('tenant.projects.show', ['tenant' => 'test', 'project' => $project->id]))
            ->assertInertia(fn ($page) => $page
                ->component('Tenant/Projects/Show')
                ->where('project.id', $project->id)
                ->has('project.tasks', 1)
                ->where('project.tasks.0.title', 'Build storefront')
            );
    }

    public function test_projects_navigation_lists_real_projects_without_opening_a_different_workspace(): void
    {
        $firstProject = Project::factory()->create(['name' => 'Landing Page']);
        $secondProject = Project::factory()->create(['name' => 'Mobile App']);
        Task::factory()->create(['project_id' => $firstProject->id]);

        $this->get(route('tenant.projects.index', ['tenant' => 'test']))
            ->assertInertia(fn ($page) => $page
                ->component('Tenant/Projects/Index')
                ->has('projects', 2)
                ->where('projects.0.name', 'Landing Page')
                ->where('projects.0.tasks_count', 1)
                ->where('projects.1.name', 'Mobile App')
            );
    }

    public function test_overview_reports_task_status_counts_from_recorded_tasks(): void
    {
        $project = Project::factory()->create(['name' => 'Metrics Project', 'status' => 'planning']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'todo']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'in_progress']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'review']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'completed']);

        $this->get(route('tenant.overview', ['tenant' => 'test']))
            ->assertInertia(fn ($page) => $page
                ->component('Tenant/Dashboard/Overview')
                ->has('projects', 1)
                ->where('projects.0.name', 'Metrics Project')
                ->where('projects.0.tasks_count', 4)
                ->where('projects.0.tasks_done', 1)
                ->where('projects.0.tasks_under_review', 1)
                ->where('projects.0.tasks_active', 2)
                ->where('projects.0.computed_status', 'review')
            );
    }

    public function test_new_project_is_included_in_the_next_projects_response(): void
    {
        $this->post(route('tenant.projects.store', ['tenant' => 'test']), [
            'name' => 'Client Portal',
            'description' => 'A self-service portal for clients.',
        ])->assertRedirect();

        $this->get(route('tenant.projects.index', ['tenant' => 'test']))
            ->assertInertia(fn ($page) => $page
                ->component('Tenant/Projects/Index')
                ->has('projects', 1)
                ->where('projects.0.name', 'Client Portal')
            );
    }

    public function test_project_assistant_returns_a_summary_from_the_ml_engine(): void
    {
        $project = Project::factory()->create(['name' => 'Launch Project']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'completed']);
        Http::fake(['127.0.0.1:8001/api/llm/project-summary' => Http::response(['status' => 'success', 'summary' => 'Launch Project is on track.'])]);

        $response = $this->postJson(route('tenant.projects.ai-assistant', ['tenant' => 'test', 'project' => $project->id]), [
            'message' => 'Summarize this project.',
            'mode' => 'summary',
        ]);

        $response->assertOk()->assertJsonPath('reply', 'Launch Project is on track.');
    }
}
