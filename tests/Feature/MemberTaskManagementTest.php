<?php

namespace Tests\Feature;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MemberTaskManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $memberUser;

    protected User $otherUser;

    protected User $reviewerUser;

    protected User $managerUser;

    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);

        $this->memberUser = User::factory()->create([
            'role' => 'programmer',
        ]);

        $this->otherUser = User::factory()->create([
            'role' => 'programmer',
        ]);

        $this->reviewerUser = User::factory()->create([
            'role' => 'programmer',
        ]);

        $this->managerUser = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        DB::table('studio_members')->insert([
            [
                'studio_id' => 'test',
                'user_id' => $this->memberUser->id,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'studio_id' => 'test',
                'user_id' => $this->otherUser->id,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'studio_id' => 'test',
                'user_id' => $this->reviewerUser->id,
                'role' => 'member',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'studio_id' => 'test',
                'user_id' => $this->managerUser->id,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->project = Project::factory()->create();
    }

    public function test_member_can_update_status_of_assigned_task(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'status' => 'todo',
            'sprint_status' => 'ready_to_start',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'in_progress',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('in_progress', $task->sprint_status);
        $this->assertEquals('in_progress', $task->status);
    }

    public function test_member_cannot_update_task_assigned_to_someone_else(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->otherUser->id,
            'status' => 'todo',
            'sprint_status' => 'ready_to_start',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'in_progress',
        ]);

        $response->assertForbidden();
    }

    public function test_member_can_move_task_back_to_todo_once_started(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'status' => 'in_progress',
            'sprint_status' => 'in_progress',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'ready_to_start',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('todo', $task->status);
        $this->assertEquals('ready_to_start', $task->sprint_status);
    }

    public function test_member_can_mark_task_as_stuck_during_in_progress(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'status' => 'in_progress',
            'sprint_status' => 'in_progress',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'stuck',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('stuck', $task->status);
        $this->assertEquals('stuck', $task->sprint_status);
    }

    public function test_member_without_reviewer_can_complete_task_directly(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'reviewer_user_id' => null,
            'status' => 'in_progress',
            'sprint_status' => 'in_progress',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'done',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('completed', $task->status);
        $this->assertEquals('done', $task->sprint_status);
    }

    public function test_member_with_reviewer_cannot_complete_task_directly(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'reviewer_user_id' => $this->reviewerUser->id,
            'status' => 'in_progress',
            'sprint_status' => 'in_progress',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'done',
        ]);

        $response->assertForbidden();

        $task->refresh();
        $this->assertEquals('in_progress', $task->status);
    }

    public function test_member_with_reviewer_can_move_task_to_review(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'reviewer_user_id' => $this->reviewerUser->id,
            'status' => 'in_progress',
            'sprint_status' => 'in_progress',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'waiting_for_review',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('review', $task->status);
        $this->assertEquals('waiting_for_review', $task->sprint_status);
    }

    public function test_doer_cannot_approve_task_in_review(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'reviewer_user_id' => $this->reviewerUser->id,
            'status' => 'review',
            'sprint_status' => 'waiting_for_review',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'done',
        ]);

        $response->assertForbidden();

        $task->refresh();
        $this->assertEquals('review', $task->status);
    }

    public function test_assigned_reviewer_can_approve_task_in_review(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'reviewer_user_id' => $this->reviewerUser->id,
            'status' => 'review',
            'sprint_status' => 'waiting_for_review',
        ]);

        $this->actingAs($this->reviewerUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'done',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('completed', $task->status);
        $this->assertEquals('done', $task->sprint_status);
    }

    public function test_manager_can_override_and_approve_task_in_review(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'reviewer_user_id' => $this->reviewerUser->id,
            'status' => 'review',
            'sprint_status' => 'waiting_for_review',
        ]);

        $this->actingAs($this->managerUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'sprint_status' => 'done',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('completed', $task->status);
        $this->assertEquals('done', $task->sprint_status);
    }

    public function test_member_cannot_modify_unauthorized_fields(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'status' => 'todo',
            'estimated_hours' => 5,
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.projects.tasks.update', [
            'tenant' => 'test',
            'project' => $this->project->id,
            'task' => $task->id,
        ]), [
            'status' => 'in_progress',
            'estimated_hours' => 20, // Disallowed for non-manager
        ]);

        $response->assertForbidden();
    }

    public function test_member_sees_tasks_assigned_via_assignments_table_on_tasks_index(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => null,
            'status' => 'in_progress',
        ]);

        DB::table('assignments')->insert([
            'task_id' => $task->id,
            'employee_user_id' => $this->memberUser->id,
            'status' => 'active',
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->get(route('tenant.tasks', ['tenant' => 'test']));
        $response->assertOk();

        $response->assertInertia(fn ($page) => $page->component('Tenant/Tasks/Index')
            ->has("tasks.{$this->project->id}", 1)
            ->where("tasks.{$this->project->id}.0.id", $task->id)
            ->where("tasks.{$this->project->id}.0.assignee", $this->memberUser->name)
        );
    }

    public function test_member_sees_tasks_assigned_via_assignments_table_on_dashboard(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => null,
            'status' => 'in_progress',
        ]);

        DB::table('assignments')->insert([
            'task_id' => $task->id,
            'employee_user_id' => $this->memberUser->id,
            'status' => 'active',
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->get(route('tenant.dashboard', ['tenant' => 'test']));
        $response->assertOk();

        $response->assertInertia(fn ($page) => $page->component('Tenant/MemberDashboard')
            ->has('myTasks', 1)
            ->where('myTasks.0.id', $task->id)
            ->where('myTasks.0.is_doer', true)
        );
    }

    public function test_task_can_be_updated_to_overdue_status(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'status' => 'todo',
            'sprint_status' => 'ready_to_start',
        ]);

        $this->actingAs($this->memberUser);

        $response = $this->patchJson(route('tenant.tasks.update-status', [
            'tenant' => 'test',
            'task' => $task->id,
        ]), [
            'status' => 'overdue',
        ]);

        $response->assertOk();

        $task->refresh();
        $this->assertEquals('overdue', $task->status);
        $this->assertEquals('overdue', $task->sprint_status);
    }

    public function test_overdue_task_creates_notifications_for_member_and_leader(): void
    {
        $overdueTask = Task::factory()->create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->memberUser->id,
            'title' => 'Overdue Critical Engine Fix',
            'status' => 'in_progress',
            'days_until_deadline' => -3,
        ]);

        // Member gets overdue notification in inbox
        $this->actingAs($this->memberUser);
        $memberResponse = $this->get(route('tenant.inbox', ['tenant' => 'test']));
        $memberResponse->assertOk();
        $memberResponse->assertInertia(fn ($page) => $page->component('Tenant/Inbox')
            ->where('notifications', fn ($notifs) => collect($notifs)->contains(fn ($n) => ($n['type'] ?? '') === 'overdue' && ($n['task_id'] ?? null) === $overdueTask->id))
        );

        // Leader gets team overdue notification in inbox
        $this->actingAs($this->managerUser);
        $leaderResponse = $this->get(route('tenant.inbox', ['tenant' => 'test']));
        $leaderResponse->assertOk();
        $leaderResponse->assertInertia(fn ($page) => $page->component('Tenant/Inbox')
            ->where('notifications', fn ($notifs) => collect($notifs)->contains(fn ($n) => ($n['type'] ?? '') === 'overdue' && ($n['task_id'] ?? null) === $overdueTask->id))
        );
    }
}
