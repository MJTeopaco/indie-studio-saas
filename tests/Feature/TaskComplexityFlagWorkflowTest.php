<?php

namespace Tests\Feature;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskComplexityFlagWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $member;

    protected User $manager;

    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->member = User::factory()->create([
            'name' => 'Alex Chen',
            'email' => 'alex@test.io',
            'role' => 'programmer',
        ]);

        $this->manager = User::factory()->create([
            'name' => 'Studio Manager',
            'email' => 'manager@test.io',
            'role' => User::ROLE_ADMIN,
        ]);

        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);

        $this->project = Project::create([
            'name' => 'Indie Title Alpha',
            'status' => 'active',
        ]);
    }

    public function test_assigned_member_can_flag_task_complexity(): void
    {
        $this->actingAs($this->member);

        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->member->id,
            'title' => 'Frontend Component Library Setup',
            'status' => 'in_progress',
            'story_points' => 13,
            'needs_estimate_review' => false,
        ]);

        $response = $this->postJson("/studio/test-studio/tasks/{$task->id}/flag-complexity", [
            'suggested_story_points' => 21,
            'feedback' => 'Third-party components have breaking changes requiring custom re-architecture.',
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'success',
        ]);

        $task->refresh();
        $this->assertTrue((bool) $task->needs_estimate_review);
        $this->assertEquals(21, $task->suggested_story_points);
        $this->assertEquals('Third-party components have breaking changes requiring custom re-architecture.', $task->estimate_review_note);
    }

    public function test_manager_can_resolve_complexity_and_update_story_points(): void
    {
        $this->actingAs($this->manager);

        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->member->id,
            'title' => 'Complex Engine Shader',
            'status' => 'in_progress',
            'story_points' => 8,
            'needs_estimate_review' => true,
            'suggested_story_points' => 13,
            'estimate_review_note' => 'Needs extra passes.',
        ]);

        $response = $this->postJson("/studio/test-studio/tasks/{$task->id}/resolve-complexity", [
            'action' => 'accept',
            'story_points' => 13,
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'success',
        ]);

        $task->refresh();
        $this->assertFalse((bool) $task->needs_estimate_review);
        $this->assertNull($task->suggested_story_points);
        $this->assertEquals(13, $task->story_points);
    }

    public function test_manager_can_dismiss_complexity_flag(): void
    {
        $this->actingAs($this->manager);

        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->member->id,
            'title' => 'Menu Audio Hookup',
            'status' => 'todo',
            'story_points' => 5,
            'needs_estimate_review' => true,
            'suggested_story_points' => 8,
            'estimate_review_note' => 'Seems hard.',
        ]);

        $response = $this->postJson("/studio/test-studio/tasks/{$task->id}/resolve-complexity", [
            'action' => 'dismiss',
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'success',
        ]);

        $task->refresh();
        $this->assertFalse((bool) $task->needs_estimate_review);
        $this->assertNull($task->suggested_story_points);
        $this->assertEquals(5, $task->story_points);
    }

    public function test_tasks_page_index_serializes_complexity_review_fields(): void
    {
        $this->actingAs($this->member);

        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->member->id,
            'title' => 'Shader Optimization Pass',
            'status' => 'in_progress',
            'story_points' => 8,
            'needs_estimate_review' => true,
            'suggested_story_points' => 13,
            'estimate_review_note' => 'Needs driver fixes for mobile GPUs.',
        ]);

        $response = $this->get('/studio/test-studio/tasks');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Tenant/Tasks/Index')
            ->has('tasks')
            ->where('tasks.' . $this->project->id . '.0.needs_estimate_review', true)
            ->where('tasks.' . $this->project->id . '.0.suggested_story_points', 13)
            ->where('tasks.' . $this->project->id . '.0.estimate_review_note', 'Needs driver fixes for mobile GPUs.')
        );
    }

    public function test_resolved_complexity_flag_notification_remains_in_manager_inbox(): void
    {
        $this->actingAs($this->manager);

        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->member->id,
            'title' => 'Core Physics Engine',
            'status' => 'in_progress',
            'story_points' => 5,
            'needs_estimate_review' => true,
            'suggested_story_points' => 8,
            'estimate_review_note' => 'Collision solver edge cases.',
        ]);

        // Manager resolves it
        $resolveResponse = $this->postJson("/studio/test-studio/tasks/{$task->id}/resolve-complexity", [
            'action' => 'accept',
            'story_points' => 8,
        ]);
        $resolveResponse->assertOk();

        // Check inbox notifications: notification still exists and is marked resolved
        $inboxResponse = $this->get('/studio/test-studio/inbox?tab=notifications');
        $inboxResponse->assertOk();
        $inboxResponse->assertInertia(fn ($page) => $page
            ->component('Tenant/Inbox')
            ->has('notifications')
            ->where('notifications.0.type', 'task_complexity_flagged')
            ->where('notifications.0.is_resolved', true)
            ->where('notifications.0.created_at_human', 'Resolved')
        );
    }

    public function test_member_receives_approved_notification_when_manager_accepts_complexity_flag(): void
    {
        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->member->id,
            'title' => 'Gameplay Ability System',
            'status' => 'in_progress',
            'story_points' => 5,
            'needs_estimate_review' => true,
            'suggested_story_points' => 13,
            'estimate_review_note' => 'Complex combo trees and cooldown tags.',
        ]);

        // Manager accepts the complexity request
        $this->actingAs($this->manager);
        $resolveResponse = $this->postJson("/studio/test-studio/tasks/{$task->id}/resolve-complexity", [
            'action' => 'accept',
            'story_points' => 13,
        ]);
        $resolveResponse->assertOk();

        // Now member logs in and visits inbox
        $this->actingAs($this->member);
        $inboxResponse = $this->get('/studio/test-studio/inbox?tab=notifications');
        $inboxResponse->assertOk();
        $inboxResponse->assertInertia(fn ($page) => $page
            ->component('Tenant/Inbox')
            ->has('notifications')
            ->where('notifications.0.type', 'task_complexity_approved')
            ->where('notifications.0.is_resolved', true)
            ->where('notifications.0.task.story_points', 13)
            ->where('notifications.0.title', "Complexity Flag Approved: #{$task->id} Gameplay Ability System")
        );
    }

    public function test_member_receives_dismissed_notification_when_manager_dismisses_complexity_flag(): void
    {
        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->member->id,
            'title' => 'Settings Audio Slider',
            'status' => 'in_progress',
            'story_points' => 3,
            'needs_estimate_review' => true,
            'suggested_story_points' => 8,
            'estimate_review_note' => 'Seems tricky.',
        ]);

        // Manager dismisses the complexity request
        $this->actingAs($this->manager);
        $resolveResponse = $this->postJson("/studio/test-studio/tasks/{$task->id}/resolve-complexity", [
            'action' => 'dismiss',
        ]);
        $resolveResponse->assertOk();

        // Now member logs in and visits inbox
        $this->actingAs($this->member);
        $inboxResponse = $this->get('/studio/test-studio/inbox?tab=notifications');
        $inboxResponse->assertOk();
        $inboxResponse->assertInertia(fn ($page) => $page
            ->component('Tenant/Inbox')
            ->has('notifications')
            ->where('notifications.0.type', 'task_complexity_dismissed')
            ->where('notifications.0.is_resolved', true)
            ->where('notifications.0.task.story_points', 3)
            ->where('notifications.0.title', "Complexity Flag Dismissed: #{$task->id} Settings Audio Slider")
        );
    }
}

