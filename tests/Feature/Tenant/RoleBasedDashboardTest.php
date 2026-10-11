<?php

namespace Tests\Feature\Tenant;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RoleBasedDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);
    }

    public function test_manager_or_owner_sees_leader_dashboard_with_studio_metrics(): void
    {
        $manager = User::factory()->create(['role' => User::ROLE_ADMIN]);
        DB::table('studio_members')->insert([
            'studio_id' => 'test-studio',
            'user_id' => $manager->id,
            'role' => 'owner',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $project = Project::create([
            'name' => 'Alpha Project',
            'status' => 'in_progress',
        ]);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Critical Task',
            'status' => 'in_progress',
            'priority' => 'CRITICAL',
            'is_critical' => true,
            'total_float' => 0,
            'estimated_hours' => 8,
        ]);

        $response = $this->actingAs($manager)->get('/studio/test-studio/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Dashboard')
            ->has('metrics')
            ->has('charts')
            ->has('tables')
            ->where('isOwner', true)
            ->has('quickActions')
            ->where('metrics.tasks_at_risk_count', 1)
        );
    }

    public function test_member_sees_member_dashboard_with_strictly_scoped_data(): void
    {
        $member = User::factory()->create(['role' => 'developer']);
        $otherMember = User::factory()->create(['role' => 'developer']);

        DB::table('studio_members')->insert([
            [
                'studio_id' => 'test-studio',
                'user_id' => $member->id,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'studio_id' => 'test-studio',
                'user_id' => $otherMember->id,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $myProject = Project::create([
            'name' => 'My Assigned Project',
            'status' => 'in_progress',
        ]);

        $secretProject = Project::create([
            'name' => 'Other Secret Project',
            'status' => 'in_progress',
        ]);

        // Task assigned to member
        Task::create([
            'project_id' => $myProject->id,
            'title' => 'Member Task',
            'status' => 'in_progress',
            'assigned_user_id' => $member->id,
            'estimated_hours' => 6,
        ]);

        // Task assigned to other member
        Task::create([
            'project_id' => $secretProject->id,
            'title' => 'Other Member Task',
            'status' => 'in_progress',
            'assigned_user_id' => $otherMember->id,
            'estimated_hours' => 12,
        ]);

        $response = $this->actingAs($member)->get('/studio/test-studio/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/MemberDashboard')
            ->has('metrics')
            ->where('metrics.open_tasks_count', 1)
            ->has('metrics.open_tasks')
            ->has('metrics.due_soon')
            ->has('metrics.overall_progress')
            ->has('metrics.hours_this_week')
            ->missing('metrics.pending_votes_count')
            ->missing('metrics.unread_mentions_count')
            ->missing('metrics.waiting_review_count')
            ->missing('metrics.points_this_sprint')
            ->where('tables.my_tasks', fn ($tasks) => count($tasks) === 1 && $tasks[0]['title'] === 'Member Task')
            // Assert no leaked studio-wide tables or actions
            ->missing('tables.team_snapshot')
            ->missing('tables.needs_attention')
            ->missing('quickActions')
            // Assert project scoping
            ->where('projects', fn ($projs) => count($projs) === 1 && $projs[0]['id'] === $myProject->id)
        );
    }
}
