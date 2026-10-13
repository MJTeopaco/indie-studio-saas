<?php

namespace Tests\Feature;

use App\Models\Tenant\Project;
use App\Models\Tenant\ProjectMember;
use App\Models\Tenant\Report;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportCenterWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $leaderUser;

    protected User $memberUser;

    protected User $otherMemberUser;

    protected Project $authorizedProject;

    protected Project $unauthorizedProject;

    protected Sprint $authorizedSprint;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);

        $this->leaderUser = User::factory()->create([
            'name' => 'Sarah Leader',
            'email' => 'sarah@studio.io',
            'role' => 'admin',
        ]);

        $this->memberUser = User::factory()->create([
            'name' => 'Alex Member',
            'email' => 'alex@studio.io',
            'role' => 'user',
        ]);

        $this->otherMemberUser = User::factory()->create([
            'name' => 'Dave Developer',
            'email' => 'dave@studio.io',
            'role' => 'user',
        ]);

        $this->authorizedProject = Project::create([
            'name' => 'Open World RPG',
            'status' => 'active',
            'start_date' => now()->subDays(30)->toDateString(),
            'target_end_date' => now()->addDays(60)->toDateString(),
        ]);

        $this->unauthorizedProject = Project::create([
            'name' => 'Top Secret Sequel',
            'status' => 'active',
            'start_date' => now()->subDays(10)->toDateString(),
            'target_end_date' => now()->addDays(90)->toDateString(),
        ]);

        // Add memberUser to authorizedProject only
        ProjectMember::create([
            'project_id' => $this->authorizedProject->id,
            'user_id' => $this->memberUser->id,
            'project_role' => 'developer',
        ]);

        $this->authorizedSprint = Sprint::create([
            'project_id' => $this->authorizedProject->id,
            'name' => 'Sprint 1 - Core World',
            'goal' => 'World geometry & basic physics',
            'status' => 'active',
            'start_date' => now()->subDays(14)->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ]);

        Task::create([
            'project_id' => $this->authorizedProject->id,
            'sprint_id' => $this->authorizedSprint->id,
            'title' => 'Terrain generation shader',
            'status' => 'completed',
            'priority' => 'High',
            'task_difficulty' => 'Hard',
            'story_points' => 8,
            'assigned_user_id' => $this->memberUser->id,
            'completed_by_user_id' => $this->memberUser->id,
            'completed_at' => now()->subDays(1),
            'hard_constraint_date' => now()->addDays(2)->toDateString(),
        ]);
    }

    public function test_team_leader_can_generate_team_performance_report(): void
    {
        $response = $this->actingAs($this->leaderUser)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'type' => 'team_performance',
                'project_id' => $this->authorizedProject->id,
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.type', 'team_performance');
        $this->assertNotEmpty($response->json('data.members_performance'));
    }

    public function test_member_cannot_generate_leader_only_team_performance_report(): void
    {
        $response = $this->actingAs($this->memberUser)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'type' => 'team_performance',
                'project_id' => $this->authorizedProject->id,
            ])
        );

        $response->assertStatus(403);
    }

    public function test_member_cannot_generate_individual_performance_for_another_employee(): void
    {
        $response = $this->actingAs($this->memberUser)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'type' => 'individual_performance',
                'employee_user_id' => $this->otherMemberUser->id,
            ])
        );

        $response->assertStatus(403);
    }

    public function test_member_cannot_generate_report_for_unauthorized_project(): void
    {
        $response = $this->actingAs($this->memberUser)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'type' => 'project_summary',
                'project_id' => $this->unauthorizedProject->id,
            ])
        );

        $response->assertStatus(403);
    }

    public function test_member_can_generate_my_performance_report(): void
    {
        $response = $this->actingAs($this->memberUser)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'type' => 'my_performance',
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.total_tasks', 1);
        $response->assertJsonPath('data.completed_tasks', 1);
        $response->assertJsonPath('data.employee.id', $this->memberUser->id);
    }

    public function test_can_archive_report_with_metadata_and_orientation(): void
    {
        $payload = [
            'name' => 'Executive Sprint 1 Audit',
            'type' => 'sprint_performance',
            'project_id' => $this->authorizedProject->id,
            'orientation' => 'landscape',
            'metrics' => [
                'title' => 'Executive Sprint 1 Audit',
                'total_tasks' => 1,
                'completed_tasks' => 1,
                'completion_rate' => 100,
            ],
        ];

        $response = $this->actingAs($this->leaderUser)->postJson(
            route('tenant.reports.archive', ['tenant' => 'test-studio']),
            $payload
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('report.orientation', 'landscape');

        $this->assertDatabaseHas('reports', [
            'name' => 'Executive Sprint 1 Audit',
            'project_id' => $this->authorizedProject->id,
            'orientation' => 'landscape',
            'created_by_user_id' => $this->leaderUser->id,
        ]);
    }

    public function test_member_cannot_delete_another_users_archived_report(): void
    {
        $leaderReport = Report::create([
            'name' => 'Confidential Strategy Report',
            'type' => 'project_summary',
            'project_id' => $this->unauthorizedProject->id,
            'created_by' => $this->leaderUser->name,
            'created_by_user_id' => $this->leaderUser->id,
            'target_name' => 'Strategy',
            'metrics' => ['total_tasks' => 0],
        ]);

        $response = $this->actingAs($this->memberUser)->deleteJson(
            route('tenant.reports.archive.delete', [
                'tenant' => 'test-studio',
                'report' => $leaderReport->id,
            ])
        );

        $response->assertStatus(403);
        $this->assertDatabaseHas('reports', ['id' => $leaderReport->id]);
    }

    public function test_can_download_server_generated_pdf_in_landscape(): void
    {
        $response = $this->actingAs($this->leaderUser)->get(
            route('tenant.reports.download-pdf', [
                'tenant' => 'test-studio',
                'type' => 'project_summary',
                'project_id' => $this->authorizedProject->id,
                'orientation' => 'landscape',
            ])
        );

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->streamedContent());
    }

    public function test_report_archive_only_shows_reports_generated_by_authenticated_user_for_both_member_and_leader(): void
    {
        $leaderReport = Report::create([
            'name' => 'Manager Executive Summary',
            'type' => 'project_summary',
            'project_id' => $this->authorizedProject->id,
            'created_by' => $this->leaderUser->name,
            'created_by_user_id' => $this->leaderUser->id,
            'target_name' => $this->authorizedProject->name,
            'metrics' => ['title' => 'Manager Executive Summary', 'total_tasks' => 5],
        ]);

        $memberReport = Report::create([
            'name' => 'Member Individual Review',
            'type' => 'my_performance',
            'project_id' => $this->authorizedProject->id,
            'employee_user_id' => $this->memberUser->id,
            'created_by' => $this->memberUser->name,
            'created_by_user_id' => $this->memberUser->id,
            'target_name' => $this->memberUser->name,
            'metrics' => ['title' => 'Member Individual Review', 'total_tasks' => 2],
        ]);

        // Member visits reports index
        $memberResponse = $this->actingAs($this->memberUser)->get(
            route('tenant.reports', ['tenant' => 'test-studio'])
        );
        $memberResponse->assertStatus(200);
        $memberArchivedReports = $memberResponse->original->getData()['page']['props']['archivedReports'];
        $memberArchivedIds = collect($memberArchivedReports)->pluck('id')->all();

        $this->assertContains($memberReport->id, $memberArchivedIds);
        $this->assertNotContains($leaderReport->id, $memberArchivedIds, 'Member must not see team manager archived report');

        // Leader visits reports index
        $leaderResponse = $this->actingAs($this->leaderUser)->get(
            route('tenant.reports', ['tenant' => 'test-studio'])
        );
        $leaderResponse->assertStatus(200);
        $leaderArchivedReports = $leaderResponse->original->getData()['page']['props']['archivedReports'];
        $leaderArchivedIds = collect($leaderArchivedReports)->pluck('id')->all();

        $this->assertContains($leaderReport->id, $leaderArchivedIds);
        $this->assertNotContains($memberReport->id, $leaderArchivedIds, 'Leader must not see member archived report');
    }

    public function test_generating_preview_automatically_archives_into_users_own_report_archive(): void
    {
        $response = $this->actingAs($this->memberUser)->getJson(
            route('tenant.reports.data', [
                'tenant' => 'test-studio',
                'type' => 'my_performance',
                'employee_user_id' => $this->memberUser->id,
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure(['data', 'archived_report' => ['id', 'name', 'created_by_user_id']]);
        $archivedId = $response->json('archived_report.id');

        $this->assertDatabaseHas('reports', [
            'id' => $archivedId,
            'created_by_user_id' => $this->memberUser->id,
        ]);
    }

    public function test_user_cannot_download_or_export_another_users_archived_report(): void
    {
        $leaderReport = Report::create([
            'name' => 'Manager Secret Report',
            'type' => 'project_summary',
            'project_id' => $this->authorizedProject->id,
            'created_by' => $this->leaderUser->name,
            'created_by_user_id' => $this->leaderUser->id,
            'target_name' => $this->authorizedProject->name,
            'metrics' => ['title' => 'Manager Secret Report', 'total_tasks' => 10],
        ]);

        // Member attempts to download manager's report as PDF
        $downloadResponse = $this->actingAs($this->memberUser)->getJson(
            route('tenant.reports.download-pdf', [
                'tenant' => 'test-studio',
                'archived_id' => $leaderReport->id,
            ])
        );
        $downloadResponse->assertStatus(403);

        // Member attempts to export manager's report as CSV
        $exportResponse = $this->actingAs($this->memberUser)->get(
            route('tenant.reports.export-csv', [
                'tenant' => 'test-studio',
                'archived_id' => $leaderReport->id,
            ])
        );
        $exportResponse->assertStatus(403);
    }
}
