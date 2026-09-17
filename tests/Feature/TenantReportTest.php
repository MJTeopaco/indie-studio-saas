<?php

namespace Tests\Feature;

use App\Mail\ReportSharedMail;
use App\Models\Tenant\ChannelMessage;
use App\Models\Tenant\Project;
use App\Models\Tenant\Report;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TenantReportTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected Project $project;

    protected Sprint $sprint;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['name' => 'Alice Lead', 'email' => 'alice@test.io', 'role' => 'admin']);
        $this->otherUser = User::factory()->create(['name' => 'Bob Dev', 'email' => 'bob@test.io']);

        // Bypass tenancy middleware and migrate tenant tables into testing DB
        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);

        // Create sample project and sprint
        $this->project = Project::create([
            'name' => 'Studio Aurora',
            'description' => 'Flagship indie adventure RPG',
            'status' => 'active',
            'start_date' => now()->subDays(10)->toDateString(),
            'target_end_date' => now()->addDays(20)->toDateString(),
        ]);

        $this->sprint = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 1 - Combat Alpha',
            'goal' => 'Implement character controller & state machine',
            'status' => 'active',
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(9)->toDateString(),
        ]);
    }

    public function test_can_render_reports_index_page(): void
    {
        $response = $this->actingAs($this->user)->get(
            route('tenant.reports', ['tenant' => 'test-studio'])
        );

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Tenant/Reports/Index')
            ->has('projects')
            ->has('initialReportData')
        );
    }

    public function test_get_report_data_returns_accurate_sprint_metrics(): void
    {
        // 1. Task completed on time
        Task::create([
            'project_id' => $this->project->id,
            'sprint_id' => $this->sprint->id,
            'title' => 'Player Movement',
            'status' => 'completed',
            'sprint_status' => 'done',
            'story_points' => 5,
            'actual_story_points' => 5,
            'priority' => 'High',
            'task_difficulty' => 'Medium',
            'assigned_user_id' => $this->user->id,
            'completed_by_user_id' => $this->user->id,
            'completed_at' => now()->subDays(2),
            'hard_constraint_date' => now()->addDays(2)->toDateString(),
        ]);

        // 2. Task unfinished & overdue
        Task::create([
            'project_id' => $this->project->id,
            'sprint_id' => $this->sprint->id,
            'title' => 'Melee Combos',
            'status' => 'in_progress',
            'sprint_status' => 'in_progress',
            'story_points' => 8,
            'priority' => 'Critical',
            'task_difficulty' => 'Hard',
            'assigned_user_id' => $this->otherUser->id,
            'hard_constraint_date' => now()->subDay()->toDateString(), // Past deadline
        ]);

        $response = $this->actingAs($this->user)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'project_id' => $this->project->id,
                'sprint_id' => $this->sprint->id,
                'scope' => 'sprint',
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.total_tasks', 2);
        $response->assertJsonPath('data.completed_tasks', 1);
        $response->assertJsonPath('data.unfinished_tasks', 1);
        $response->assertJsonPath('data.overdue_tasks', 1);
        $response->assertJsonPath('data.completion_rate', 50);
        $response->assertJsonPath('data.planned_story_points', 13);
        $response->assertJsonPath('data.completed_story_points', 5);

        // Audit tasks assertions
        $auditTasks = $response->json('data.audit_tasks');
        $this->assertCount(2, $auditTasks);
        $this->assertEquals('on_time', $auditTasks[0]['on_time_status']);
        $this->assertEquals('overdue', $auditTasks[1]['on_time_status']);

        // Employee performance assertions
        $empPerf = $response->json('data.employee_performance');
        $this->assertNotEmpty($empPerf);
    }

    public function test_get_report_data_returns_accurate_project_aggregate_metrics(): void
    {
        // Add sprint 2
        $sprint2 = Sprint::create([
            'project_id' => $this->project->id,
            'name' => 'Sprint 2 - Audio & FX',
            'status' => 'planned',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(24)->toDateString(),
        ]);

        Task::create([
            'project_id' => $this->project->id,
            'sprint_id' => $this->sprint->id,
            'title' => 'Core Physics',
            'status' => 'completed',
            'story_points' => 3,
            'assigned_user_id' => $this->user->id,
        ]);

        Task::create([
            'project_id' => $this->project->id,
            'sprint_id' => $sprint2->id,
            'title' => 'Spatial Sound',
            'status' => 'todo',
            'story_points' => 5,
            'assigned_user_id' => $this->otherUser->id,
        ]);

        $response = $this->actingAs($this->user)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'project_id' => $this->project->id,
                'scope' => 'project',
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.scope', 'project');
        $response->assertJsonPath('data.total_tasks', 2);
        $response->assertJsonPath('data.completed_tasks', 1);
        $response->assertJsonPath('data.completion_rate', 50);
        $this->assertCount(2, $response->json('data.sprints_breakdown'));
    }

    public function test_share_report_via_email_validation_and_delivery(): void
    {
        Mail::fake();

        // 1. Invalid email validation
        $failResponse = $this->actingAs($this->user)->postJson(
            route('tenant.reports.share-email', ['tenant' => 'test-studio']),
            [
                'recipient_email' => 'not-an-email',
                'project_id' => $this->project->id,
            ]
        );
        $failResponse->assertStatus(422);

        // 2. Successful delivery
        $successResponse = $this->actingAs($this->user)->postJson(
            route('tenant.reports.share-email', ['tenant' => 'test-studio']),
            [
                'recipient_email' => 'director@publisher.com',
                'project_id' => $this->project->id,
                'sprint_id' => $this->sprint->id,
                'personal_note' => 'Please review our sprint milestones.',
            ]
        );

        $successResponse->assertStatus(200);
        $successResponse->assertJsonPath('success', true);

        Mail::assertSent(ReportSharedMail::class, function ($mail) {
            $attachments = $mail->attachments();
            $hasPdf = ! empty($mail->pdfContent);
            $hasCsv = ! empty($mail->csvContent);

            return $mail->hasTo('director@publisher.com')
                && str_contains($mail->personalNote, 'Please review our sprint milestones.')
                && $hasPdf
                && $hasCsv
                && count($attachments) === 2;
        });
    }

    public function test_share_report_via_chat_message(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            route('tenant.reports.share-chat', ['tenant' => 'test-studio']),
            [
                'recipient_type' => 'dm',
                'recipient_id' => (string) $this->otherUser->id,
                'project_id' => $this->project->id,
                'sprint_id' => $this->sprint->id,
                'personal_note' => 'Sprint 1 report for your review!',
            ]
        );

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);

        $first = min($this->user->id, $this->otherUser->id);
        $second = max($this->user->id, $this->otherUser->id);
        $expectedDm = "dm-{$first}_{$second}";

        $this->assertDatabaseHas('channel_messages', [
            'channel_id' => $expectedDm,
            'user_id' => $this->user->id,
        ]);

        $message = ChannelMessage::where('channel_id', $expectedDm)->latest()->first();
        $this->assertNotNull($message);
        $this->assertStringContainsString('Sprint 1 report for your review!', $message->body);
        $this->assertEquals('report', $message->attachments[0]['type']);
    }

    public function test_export_csv_streams_valid_csv_content(): void
    {
        Task::create([
            'project_id' => $this->project->id,
            'sprint_id' => $this->sprint->id,
            'title' => 'Shader Optimization',
            'status' => 'completed',
            'story_points' => 3,
            'assigned_user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->get(
            route('tenant.reports.export-csv', [
                'tenant' => 'test-studio',
                'project_id' => $this->project->id,
                'sprint_id' => $this->sprint->id,
            ])
        );

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_channel_messages_index_returns_updated_messages_for_realtime_sync(): void
    {
        $msg1 = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->user->id,
            'sender_name' => 'Alice',
            'body' => 'First message',
            'is_pinned' => false,
        ]);

        $msg2 = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->otherUser->id,
            'sender_name' => 'Bob',
            'body' => 'Second message',
            'is_pinned' => false,
        ]);

        // Pin msg1 recently
        $msg1->update(['is_pinned' => true, 'pinned_at' => now()]);

        // Client polls with after_id equal to msg2->id
        $response = $this->actingAs($this->user)->getJson(
            route('tenant.channels.messages.index', [
                'tenant' => 'test-studio',
                'channelId' => 'ch-general',
                'after_id' => $msg2->id,
            ])
        );

        $response->assertStatus(200);
        // updated_messages should include msg1 which was pinned recently!
        $this->assertNotEmpty($response->json('updated_messages'));
        $updatedIds = collect($response->json('updated_messages'))->pluck('id')->all();
        $this->assertContains($msg1->id, $updatedIds);
    }

    public function test_task_status_completed_sets_completed_at_and_completed_by(): void
    {
        $task = Task::create([
            'project_id' => $this->project->id,
            'sprint_id' => $this->sprint->id,
            'title' => 'Enemy AI Pathfinding',
            'status' => 'in_progress',
            'sprint_status' => 'in_progress',
            'assigned_user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->patchJson(
            route('tenant.tasks.update-status', ['tenant' => 'test-studio', 'task' => $task->id]),
            ['status' => 'completed']
        );

        $response->assertStatus(200);

        $fresh = $task->fresh();
        $this->assertEquals('completed', $fresh->status);
        $this->assertNotNull($fresh->completed_at);
        $this->assertEquals($this->user->id, $fresh->completed_by_user_id);
    }

    public function test_share_archived_report_via_email(): void
    {
        Mail::fake();

        $archived = Report::create([
            'name' => 'Q3 Velocity Benchmark',
            'type' => 'project',
            'target_name' => 'Test RPG Project',
            'created_by' => 'Studio Lead',
            'metrics' => [
                'title' => 'Q3 Velocity Benchmark',
                'scope' => 'project',
                'total_tasks' => 12,
                'completed_tasks' => 10,
                'completion_rate' => 83,
                'tasks_list' => [
                    [
                        'id' => 101,
                        'title' => 'Inventory System Polish',
                        'status' => 'completed',
                        'priority' => 'high',
                        'assignee' => 'Dev Alice',
                        'is_critical' => true,
                    ],
                ],
            ],
        ]);

        $response = $this->actingAs($this->user)->postJson(
            route('tenant.reports.share-email', ['tenant' => 'test-studio']),
            [
                'recipient_email' => 'exec@studio.io',
                'archived_report_id' => $archived->id,
                'personal_note' => 'Archived registry audit snapshot.',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        Mail::assertSent(ReportSharedMail::class, function ($mail) {
            $attachments = $mail->attachments();
            $hasPdf = ! empty($mail->pdfContent);
            $hasCsv = ! empty($mail->csvContent);

            return $mail->hasTo('exec@studio.io')
                && str_contains($mail->personalNote, 'Archived registry audit snapshot.')
                && $hasPdf
                && $hasCsv
                && count($attachments) === 2;
        });
    }
}
