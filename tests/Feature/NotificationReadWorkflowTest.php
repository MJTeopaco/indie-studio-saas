<?php

namespace Tests\Feature;

use App\Http\Controllers\TenantDashboardController;
use App\Models\Tenant\ChannelMessage;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NotificationReadWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Jane Dev',
            'email' => 'jane@test.io',
            'role' => 'programmer',
        ]);

        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);

        $this->project = Project::create([
            'name' => 'Indie Title Alpha',
            'status' => 'active',
        ]);
    }

    public function test_can_mark_notification_as_read_and_unread(): void
    {
        $this->actingAs($this->user);

        $notifId = 'task-42-review_request';

        // 1. Mark as read
        $response = $this->postJson("/studio/test-studio/notifications/{$notifId}/read");
        $response->assertOk();
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('notification_reads', [
            'user_id' => $this->user->id,
            'notification_id' => $notifId,
        ]);

        // 2. Mark as unread
        $response = $this->postJson("/studio/test-studio/notifications/{$notifId}/unread");
        $response->assertOk();
        $response->assertJson(['success' => true]);

        $this->assertDatabaseMissing('notification_reads', [
            'user_id' => $this->user->id,
            'notification_id' => $notifId,
        ]);
    }

    public function test_can_mark_all_notifications_as_read(): void
    {
        $this->actingAs($this->user);

        // Create tasks assigned to user
        $task = Task::create([
            'project_id' => $this->project->id,
            'assigned_user_id' => $this->user->id,
            'title' => 'Implement Sound FX',
            'status' => 'todo',
            'priority' => 'high',
        ]);

        $response = $this->postJson('/studio/test-studio/notifications/read-all');
        $response->assertOk();
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('notification_reads', [
            'user_id' => $this->user->id,
            'notification_id' => "task-{$task->id}-task_assigned",
        ]);

        $this->assertDatabaseHas('notification_reads', [
            'user_id' => $this->user->id,
            'notification_id' => 'estimates-pending',
        ]);
    }

    public function test_can_get_inbox_unread_count(): void
    {
        $this->actingAs($this->user);

        $response = $this->getJson('/studio/test-studio/inbox/unread-count');
        $response->assertOk();
        $response->assertJsonStructure([
            'notifications',
            'messages',
            'total',
        ]);
    }

    public function test_channel_messages_appear_in_notifications(): void
    {
        $this->actingAs($this->user);

        $sender = User::factory()->create(['name' => 'Alice']);

        if (Schema::hasTable('channel_messages')) {
            ChannelMessage::create([
                'channel_id' => 'ch-general',
                'user_id' => $sender->id,
                'sender_name' => 'Alice',
                'body' => 'Hello team in general channel!',
                'is_unsent' => false,
            ]);
        }

        $controller = app(TenantDashboardController::class);
        $notifs = $controller->getMessageNotifications($this->user);

        $this->assertNotEmpty($notifs);
        $this->assertEquals('channel_message', $notifs[0]['type']);
        $this->assertStringContainsString('#general', $notifs[0]['title']);
    }
}
