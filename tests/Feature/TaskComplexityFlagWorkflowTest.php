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
}
