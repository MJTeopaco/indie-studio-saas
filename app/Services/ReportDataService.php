<?php

namespace App\Services;

use App\Models\Studio;
use App\Models\Tenant\ActivityLog;
use App\Models\Tenant\Project;
use App\Models\Tenant\ProjectMember;
use App\Models\Tenant\Report;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReportDataService
{
    /**
     * Check if a user has team leader, manager, or admin privileges in the tenant/studio.
     */
    public function isLeaderOrManager(User $user, ?string $tenantId = null): bool
    {
        if ($user->role === User::ROLE_ADMIN) {
            return true;
        }

        $tenantId = $tenantId ?? (tenant('id') ? (string) tenant('id') : null);
        if (! $tenantId) {
            return false;
        }

        try {
            $member = DB::connection(config('tenancy.database.central_connection', 'central'))
                ->table('studio_members')
                ->where('studio_id', $tenantId)
                ->where('user_id', $user->id)
                ->first();

            $role = $member ? $member->role : 'member';

            return in_array($role, ['owner', 'leader', 'manager', 'admin'], true);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Get IDs of all projects the user is authorized to access.
     * Leaders/managers get all projects; members get only projects they belong to.
     *
     * @return array<int>
     */
    public function getAuthorizedProjectIds(User $user, ?string $tenantId = null): array
    {
        if ($this->isLeaderOrManager($user, $tenantId)) {
            return Project::pluck('id')->all();
        }

        // For members: check project_members pivot table or tasks assigned to them
        $memberProjectIds = ProjectMember::where('user_id', $user->id)->pluck('project_id')->all();
        $taskProjectIds = Task::where('assigned_user_id', $user->id)->pluck('project_id')->all();

        return array_values(array_unique(array_merge($memberProjectIds, $taskProjectIds)));
    }

    /**
     * Check if a user is authorized to access a specific project.
     */
    public function isAuthorizedForProject(User $user, int $projectId, ?string $tenantId = null): bool
    {
        $authorizedIds = $this->getAuthorizedProjectIds($user, $tenantId);

        return in_array($projectId, $authorizedIds, true);
    }

    /**
     * Check if a user is authorized to access a specific sprint.
     */
    public function isAuthorizedForSprint(User $user, int $sprintId, ?string $tenantId = null): bool
    {
        $sprint = Sprint::find($sprintId);
        if (! $sprint) {
            return false;
        }

        return $this->isAuthorizedForProject($user, $sprint->project_id, $tenantId);
    }

    /**
     * Get available report types metadata tailored to the user's role.
     *
     * @return array<array<string, mixed>>
     */
    public function getAvailableReportTypes(User $user, ?string $tenantId = null): array
    {
        $isLeader = $this->isLeaderOrManager($user, $tenantId);

        if ($isLeader) {
            return [
                [
                    'key' => 'project_summary',
                    'name' => 'Project Summary Report',
                    'description' => 'Comprehensive executive status, completion KPI cards, epic status, and progress metrics for a project.',
                    'category' => 'project',
                    'badge' => 'Leadership',
                    'requires_project' => true,
                    'requires_sprint' => false,
                    'requires_employee' => false,
                    'supports_multi_sprint' => false,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'portrait',
                ],
                [
                    'key' => 'sprint_performance',
                    'name' => 'Sprint Performance Report',
                    'description' => 'Burndown progress, planned vs. completed Story Points, and task execution breakdown across one or multiple selected sprints.',
                    'category' => 'sprint',
                    'badge' => 'Multi-Sprint',
                    'requires_project' => true,
                    'requires_sprint' => true,
                    'requires_employee' => false,
                    'supports_multi_sprint' => true,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'landscape',
                ],
                [
                    'key' => 'individual_performance',
                    'name' => 'Individual Employee Performance Report',
                    'description' => 'Targeted evaluation of an employee with completion rate, story points delivered, workload trends, and historical output.',
                    'category' => 'people',
                    'badge' => 'Team Leader',
                    'requires_project' => false,
                    'requires_sprint' => false,
                    'requires_employee' => true,
                    'supports_multi_sprint' => false,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'portrait',
                ],
                [
                    'key' => 'team_performance',
                    'name' => 'Team Performance Report',
                    'description' => 'Comparative analysis of workload distribution and completed tasks across employees with balanced, non-misleading scales.',
                    'category' => 'people',
                    'badge' => 'Leadership',
                    'requires_project' => false,
                    'requires_sprint' => false,
                    'requires_employee' => false,
                    'supports_multi_sprint' => false,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'landscape',
                ],
                [
                    'key' => 'task_audit',
                    'name' => 'Task Audit and History Report',
                    'description' => 'Forensic chronological timeline and table detailing task creators, assignees, state changes, story points revisions, and timestamps.',
                    'category' => 'audit',
                    'badge' => 'Detailed Audit',
                    'requires_project' => false,
                    'requires_sprint' => false,
                    'requires_employee' => false,
                    'supports_multi_sprint' => false,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'landscape',
                ],
                [
                    'key' => 'workload_assignment',
                    'name' => 'Employee Workload and Assignment Report',
                    'description' => 'Active task distribution, critical path allocations, match fit alignment, and assignment method breakdowns.',
                    'category' => 'people',
                    'badge' => 'Optimization',
                    'requires_project' => false,
                    'requires_sprint' => false,
                    'requires_employee' => false,
                    'supports_multi_sprint' => false,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'portrait',
                ],
                [
                    'key' => 'project_analytics',
                    'name' => 'Project Analytics Dashboard Report',
                    'description' => 'High-density visual dashboard with task status breakdown, completion trends, overdue tasks, and velocity insights.',
                    'category' => 'analytics',
                    'badge' => 'Executive',
                    'requires_project' => true,
                    'requires_sprint' => false,
                    'requires_employee' => false,
                    'supports_multi_sprint' => false,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'landscape',
                ],
                [
                    'key' => 'my_performance',
                    'name' => 'My Performance Report',
                    'description' => 'Personal performance audit, deliverables, completed vs pending tasks, and story points delivered.',
                    'category' => 'personal',
                    'badge' => 'Personal',
                    'requires_project' => false,
                    'requires_sprint' => false,
                    'requires_employee' => false,
                    'supports_multi_sprint' => false,
                    'supports_date_range' => true,
                    'recommended_orientation' => 'portrait',
                ],
            ];
        }

        // Member Reports
        return [
            [
                'key' => 'my_performance',
                'name' => 'My Performance Report',
                'description' => 'Your personal completion rate, story points burned, on-time delivery stats, and output velocity.',
                'category' => 'personal',
                'badge' => 'Personal',
                'requires_project' => false,
                'requires_sprint' => false,
                'requires_employee' => false,
                'supports_multi_sprint' => false,
                'supports_date_range' => true,
                'recommended_orientation' => 'portrait',
            ],
            [
                'key' => 'my_tasks',
                'name' => 'My Task Report',
                'description' => 'Detailed list of tasks assigned to you, including status, priority, deadlines, story points, and notes.',
                'category' => 'personal',
                'badge' => 'Tasks',
                'requires_project' => false,
                'requires_sprint' => false,
                'requires_employee' => false,
                'supports_multi_sprint' => false,
                'supports_date_range' => true,
                'recommended_orientation' => 'portrait',
            ],
            [
                'key' => 'my_sprints',
                'name' => 'My Sprint Report',
                'description' => 'Review of your individual contributions, sprint commitments, and achievements across project sprints.',
                'category' => 'personal',
                'badge' => 'Sprints',
                'requires_project' => false,
                'requires_sprint' => false,
                'requires_employee' => false,
                'supports_multi_sprint' => false,
                'supports_date_range' => true,
                'recommended_orientation' => 'portrait',
            ],
            [
                'key' => 'my_task_activity',
                'name' => 'My Task Activity History',
                'description' => 'Chronological audit trail of your task status updates, story points estimates, and completions.',
                'category' => 'personal',
                'badge' => 'Activity',
                'requires_project' => false,
                'requires_sprint' => false,
                'requires_employee' => false,
                'supports_multi_sprint' => false,
                'supports_date_range' => true,
                'recommended_orientation' => 'portrait',
            ],
            [
                'key' => 'my_progress_analytics',
                'name' => 'My Progress and Analytics Report',
                'description' => 'Visual overview of your personal progress, completion trends, and task difficulty distributions.',
                'category' => 'personal',
                'badge' => 'Analytics',
                'requires_project' => false,
                'requires_sprint' => false,
                'requires_employee' => false,
                'supports_multi_sprint' => false,
                'supports_date_range' => true,
                'recommended_orientation' => 'landscape',
            ],
            [
                'key' => 'project_summary',
                'name' => 'Project Summary Report',
                'description' => 'Overview of project progress and sprint goals for projects you are an authorized member of.',
                'category' => 'project',
                'badge' => 'Authorized Projects',
                'requires_project' => true,
                'requires_sprint' => false,
                'requires_employee' => false,
                'supports_multi_sprint' => false,
                'supports_date_range' => true,
                'recommended_orientation' => 'portrait',
            ],
            [
                'key' => 'sprint_performance',
                'name' => 'Sprint Report',
                'description' => 'Sprint velocity and completion report for sprints belonging to your assigned projects.',
                'category' => 'sprint',
                'badge' => 'Authorized Sprints',
                'requires_project' => true,
                'requires_sprint' => true,
                'requires_employee' => false,
                'supports_multi_sprint' => false,
                'supports_date_range' => true,
                'recommended_orientation' => 'landscape',
            ],
        ];
    }

    /**
     * Check if a user has permission to generate a specific report type with the given filters.
     */
    public function canGenerateReportType(
        User $user,
        string $reportType,
        ?int $projectId = null,
        ?int $employeeUserId = null,
        ?string $tenantId = null
    ): bool {
        $isLeader = $this->isLeaderOrManager($user, $tenantId);

        // Member attempting leader-only report types
        $leaderOnlyTypes = [
            'team_performance',
            'task_audit',
            'workload_assignment',
            'project_analytics',
        ];

        if (! $isLeader && in_array($reportType, $leaderOnlyTypes, true)) {
            return false;
        }

        // If member tries individual_performance for someone else
        if (! $isLeader && $reportType === 'individual_performance') {
            if ($employeeUserId !== null && $employeeUserId !== (int) $user->id) {
                return false;
            }
        }

        // Check project access if project is provided
        if ($projectId !== null) {
            if (! $this->isAuthorizedForProject($user, $projectId, $tenantId)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a user can view an archived report.
     * Report archive strictly shows only what each user generated preview, be it member or team leader.
     */
    public function canAccessReport(User $user, Report $report, ?string $tenantId = null): bool
    {
        return $report->created_by_user_id !== null && (int) $report->created_by_user_id === (int) $user->id;
    }

    /**
     * Primary entry point: Calculate report metrics based on type and input filters.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    public function calculateReport(string $type, array $params, User $user, ?string $tenantId = null): ?array
    {
        $isLeader = $this->isLeaderOrManager($user, $tenantId);

        // Security check
        $projectId = ! empty($params['project_id']) ? (int) $params['project_id'] : null;
        $employeeUserId = ! empty($params['employee_user_id']) ? (int) $params['employee_user_id'] : null;

        if (! $this->canGenerateReportType($user, $type, $projectId, $employeeUserId, $tenantId)) {
            return null;
        }

        // Scope employee ID for members
        if (! $isLeader && in_array($type, ['my_performance', 'my_tasks', 'my_sprints', 'my_task_activity', 'my_progress_analytics', 'individual_performance'], true)) {
            $employeeUserId = (int) $user->id;
        }

        $usersMap = $this->getUsersMap($tenantId);

        return match ($type) {
            'project_summary' => $this->buildProjectSummaryReport($projectId, $params, $user, $usersMap),
            'sprint_performance' => $this->buildSprintPerformanceReport($projectId, $params, $user, $usersMap),
            'individual_performance' => $this->buildIndividualPerformanceReport($employeeUserId ?? $user->id, $projectId, $params, $usersMap),
            'team_performance' => $this->buildTeamPerformanceReport($projectId, $params, $usersMap),
            'task_audit' => $this->buildTaskAuditReport($projectId, $params, $usersMap),
            'workload_assignment' => $this->buildWorkloadAssignmentReport($projectId, $params, $usersMap),
            'project_analytics' => $this->buildProjectAnalyticsReport($projectId, $usersMap),
            'my_performance' => $this->buildIndividualPerformanceReport($user->id, $projectId, $params, $usersMap, 'My Performance Report'),
            'my_tasks' => $this->buildMyTasksReport($user->id, $projectId, $params, $usersMap),
            'my_sprints' => $this->buildMySprintsReport($user->id, $projectId, $params, $usersMap),
            'my_task_activity' => $this->buildMyTaskActivityReport($user->id, $params),
            'my_progress_analytics' => $this->buildMyProgressAnalyticsReport($user->id, $params, $usersMap),
            default => null,
        };
    }

    /**
     * Map of users in the active studio.
     *
     * @return Collection<int, User>
     */
    public function getUsersMap(?string $tenantId = null): Collection
    {
        $tenantId = $tenantId ?? (tenant('id') ? (string) tenant('id') : null);
        $studio = Studio::find($tenantId);

        if (! $studio) {
            return collect();
        }

        try {
            return $studio->users()->get()->keyBy('id');
        } catch (\Throwable $e) {
            return collect();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // REPORT BUILDERS
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * 1. Project Summary Report
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildProjectSummaryReport(?int $projectId, array $params, User $user, Collection $usersMap): ?array
    {
        $project = Project::with(['sprints', 'epics'])->find($projectId);
        if (! $project) {
            return null;
        }

        $dateRange = $this->parseDateRange($params);
        $tasksQuery = Task::where('project_id', $project->id);
        $this->applyDateRangeToTaskQuery($tasksQuery, $dateRange);
        $tasks = $tasksQuery->get();

        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('status', 'completed')->count();
        $inProgressTasks = $tasks->where('status', 'in_progress')->count();
        $reviewTasks = $tasks->where('status', 'review')->count();
        $todoTasks = $tasks->where('status', 'todo')->count();

        $today = Carbon::today();
        $overdueTasks = $tasks->filter(function ($t) use ($today) {
            if ($t->status === 'completed') {
                return false;
            }
            $deadline = $t->hard_constraint_date ? Carbon::parse($t->hard_constraint_date) : null;

            return $deadline && $today->gt($deadline->startOfDay());
        })->count();

        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;
        $plannedSp = (int) $tasks->sum('story_points');
        $completedSp = (int) $tasks->where('status', 'completed')->sum('story_points');

        // Epics breakdown
        $epicsSummary = $project->epics->map(function ($epic) {
            $eTasks = Task::where('epic_id', $epic->id)->get();
            $tot = $eTasks->count();
            $done = $eTasks->where('status', 'completed')->count();

            return [
                'id' => $epic->id,
                'name' => $epic->name,
                'total_tasks' => $tot,
                'completed_tasks' => $done,
                'completion_rate' => $tot > 0 ? round(($done / $tot) * 100, 1) : 0,
            ];
        })->all();

        // Sprints breakdown
        $sprintsSummary = $project->sprints->map(function ($sprint) {
            $sTasks = Task::where('sprint_id', $sprint->id)->get();
            $tot = $sTasks->count();
            $done = $sTasks->where('status', 'completed')->count();
            $spPlanned = (int) $sTasks->sum('story_points');
            $spDone = (int) $sTasks->where('status', 'completed')->sum('story_points');

            return [
                'id' => $sprint->id,
                'name' => $sprint->name,
                'status' => $sprint->status,
                'start_date' => $sprint->start_date?->format('M d, Y') ?? '—',
                'end_date' => $sprint->end_date?->format('M d, Y') ?? '—',
                'total_tasks' => $tot,
                'completed_tasks' => $done,
                'planned_sp' => $spPlanned,
                'completed_sp' => $spDone,
                'completion_rate' => $tot > 0 ? round(($done / $tot) * 100, 1) : 0,
            ];
        })->all();

        // Plain language insight
        $insight = "Project '{$project->name}' is {$completionRate}% complete with {$completedTasks} of {$totalTasks} tasks resolved.";
        if ($overdueTasks > 0) {
            $insight .= " Attention required: {$overdueTasks} task(s) are currently past their hard deadline.";
        } else {
            $insight .= ' All in-flight tasks are currently within scheduled deadlines.';
        }

        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        // Employee performance breakdown
        $empStats = [];
        foreach ($auditTasks as $t) {
            $uId = (int) ($t['assigned_user_id'] ?? 0);
            $uName = $t['assigned_employee'] ?? "User #{$uId}";
            if (! isset($empStats[$uId])) {
                $empStats[$uId] = [
                    'user_id' => $uId,
                    'name' => $uName,
                    'assigned_count' => 0,
                    'completed_count' => 0,
                    'unfinished_count' => 0,
                    'planned_sp' => 0,
                    'completed_sp' => 0,
                ];
            }
            $empStats[$uId]['assigned_count']++;
            $empStats[$uId]['planned_sp'] += (int) ($t['original_sp'] ?? 0);
            if ($t['status'] === 'completed') {
                $empStats[$uId]['completed_count']++;
                $empStats[$uId]['completed_sp'] += (int) ($t['final_sp'] ?? 0);
            } else {
                $empStats[$uId]['unfinished_count']++;
            }
        }
        $employeePerformance = array_values($empStats);

        return [
            'type' => 'project_summary',
            'scope' => 'project',
            'title' => "{$project->name} — Project Summary Report",
            'project_id' => $project->id,
            'project_name' => $project->name,
            'project_status' => $project->status,
            'start_date' => $project->start_date?->format('M d, Y') ?? '—',
            'target_end_date' => $project->target_end_date?->format('M d, Y') ?? '—',
            'reporting_period' => $this->formatReportingPeriod($dateRange, $project->start_date?->format('M d, Y'), $project->target_end_date?->format('M d, Y')),
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'unfinished_tasks' => $totalTasks - $completedTasks,
            'in_progress_tasks' => $inProgressTasks,
            'review_tasks' => $reviewTasks,
            'todo_tasks' => $todoTasks,
            'overdue_tasks' => $overdueTasks,
            'completion_rate' => $completionRate,
            'planned_story_points' => $plannedSp,
            'completed_story_points' => $completedSp,
            'sp_completion_rate' => $plannedSp > 0 ? round(($completedSp / $plannedSp) * 100, 1) : 0,
            'epics_summary' => $epicsSummary,
            'sprints_breakdown' => $sprintsSummary,
            'audit_tasks' => $auditTasks,
            'employee_performance' => $employeePerformance,
            'executive_insight' => $insight,
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 2. Sprint Performance Report (Supports Single or Multiple Selected Sprints)
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildSprintPerformanceReport(?int $projectId, array $params, User $user, Collection $usersMap): ?array
    {
        $project = Project::find($projectId);
        if (! $project) {
            return null;
        }

        // Support single or multiple sprint IDs
        $sprintIds = [];
        if (! empty($params['sprint_ids']) && is_array($params['sprint_ids'])) {
            $sprintIds = array_map('intval', $params['sprint_ids']);
        } elseif (! empty($params['sprint_id'])) {
            $sprintIds = [(int) $params['sprint_id']];
        } else {
            // Default to active sprint or first sprint
            $defaultSprint = Sprint::where('project_id', $project->id)->where('status', 'active')->first()
                ?? Sprint::where('project_id', $project->id)->first();
            if ($defaultSprint) {
                $sprintIds = [$defaultSprint->id];
            }
        }

        $sprints = Sprint::where('project_id', $project->id)->whereIn('id', $sprintIds)->orderBy('start_date')->get();
        if ($sprints->isEmpty()) {
            return null;
        }

        $dateRange = $this->parseDateRange($params);
        $tasksQuery = Task::whereIn('sprint_id', $sprints->pluck('id'))->with(['assignee', 'completedBy']);
        $this->applyDateRangeToTaskQuery($tasksQuery, $dateRange);
        $tasks = $tasksQuery->get();

        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        $totalTasks = count($auditTasks);
        $completedTasks = count(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed'));
        $inProgressTasks = count(array_filter($auditTasks, fn ($t) => in_array($t['status'], ['in_progress', 'review'], true)));
        $unfinishedTasks = $totalTasks - $completedTasks;
        $overdueTasks = count(array_filter($auditTasks, fn ($t) => $t['on_time_status'] === 'overdue'));

        $plannedSp = array_sum(array_column($auditTasks, 'original_sp'));
        $completedSp = array_sum(array_column(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed'), 'final_sp'));

        $sprintNames = $sprints->pluck('name')->implode(', ');
        $title = count($sprints) === 1
            ? "{$project->name} — {$sprints->first()->name} Performance Report"
            : "{$project->name} — Multi-Sprint ({$sprintNames}) Performance Report";

        // Per-sprint breakdown for chart comparison
        $sprintComparison = $sprints->map(function ($sp) use ($auditTasks) {
            $spTasks = array_filter($auditTasks, fn ($t) => (int) ($t['sprint_id'] ?? 0) === $sp->id);
            $spTotal = count($spTasks);
            $spDone = count(array_filter($spTasks, fn ($t) => $t['status'] === 'completed'));
            $planned = array_sum(array_column($spTasks, 'original_sp'));
            $burned = array_sum(array_column(array_filter($spTasks, fn ($t) => $t['status'] === 'completed'), 'final_sp'));

            return [
                'id' => $sp->id,
                'name' => $sp->name,
                'status' => $sp->status,
                'total_tasks' => $spTotal,
                'completed_tasks' => $spDone,
                'planned_sp' => $planned,
                'completed_sp' => $burned,
                'completion_rate' => $spTotal > 0 ? round(($spDone / $spTotal) * 100, 1) : 0,
            ];
        })->all();

        // Employee performance breakdown
        $empStats = [];
        foreach ($auditTasks as $t) {
            $uId = (int) ($t['assigned_user_id'] ?? 0);
            $uName = $t['assigned_employee'] ?? "User #{$uId}";
            if (! isset($empStats[$uId])) {
                $empStats[$uId] = [
                    'user_id' => $uId,
                    'name' => $uName,
                    'assigned_count' => 0,
                    'completed_count' => 0,
                    'unfinished_count' => 0,
                    'planned_sp' => 0,
                    'completed_sp' => 0,
                ];
            }
            $empStats[$uId]['assigned_count']++;
            $empStats[$uId]['planned_sp'] += (int) ($t['original_sp'] ?? 0);
            if ($t['status'] === 'completed') {
                $empStats[$uId]['completed_count']++;
                $empStats[$uId]['completed_sp'] += (int) ($t['final_sp'] ?? 0);
            } else {
                $empStats[$uId]['unfinished_count']++;
            }
        }
        $employeePerformance = array_values($empStats);

        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;
        $spCompletionRate = $plannedSp > 0 ? round(($completedSp / $plannedSp) * 100, 1) : 0;

        $insight = "Sprint scope delivery reached {$spCompletionRate}% of committed Story Points ({$completedSp} of {$plannedSp} pts). ";
        $insight .= "{$completedTasks} tasks closed, {$inProgressTasks} actively in progress, and {$unfinishedTasks} remaining.";

        return [
            'type' => 'sprint_performance',
            'scope' => 'sprint',
            'title' => $title,
            'project_id' => $project->id,
            'project_name' => $project->name,
            'sprints_selected' => $sprints->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'status' => $s->status])->all(),
            'reporting_period' => $this->formatReportingPeriod(
                $dateRange,
                $sprints->first()->start_date?->format('M d, Y'),
                $sprints->last()->end_date?->format('M d, Y')
            ),
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'in_progress_tasks' => $inProgressTasks,
            'unfinished_tasks' => $unfinishedTasks,
            'overdue_tasks' => $overdueTasks,
            'completion_rate' => $completionRate,
            'planned_story_points' => $plannedSp,
            'completed_story_points' => $completedSp,
            'sp_completion_rate' => $spCompletionRate,
            'audit_tasks' => $auditTasks,
            'employee_performance' => $employeePerformance,
            'sprint_comparison' => $sprintComparison,
            'executive_insight' => $insight,
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 3. Individual Employee Performance Report
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildIndividualPerformanceReport(int $employeeUserId, ?int $projectId, array $params, Collection $usersMap, ?string $customTitle = null): ?array
    {
        $employee = $usersMap->get($employeeUserId) ?? User::find($employeeUserId);
        if (! $employee) {
            return null;
        }

        $dateRange = $this->parseDateRange($params);
        $tasksQuery = Task::where('assigned_user_id', $employee->id)->with(['project', 'sprint']);

        if ($projectId) {
            $tasksQuery->where('project_id', $projectId);
        }
        if (! empty($params['sprint_id'])) {
            $tasksQuery->where('sprint_id', (int) $params['sprint_id']);
        }
        $this->applyDateRangeToTaskQuery($tasksQuery, $dateRange);

        $tasks = $tasksQuery->get();
        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        $totalTasks = count($auditTasks);
        $completedTasks = count(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed'));
        $pendingTasks = $totalTasks - $completedTasks;
        $onTimeCount = count(array_filter($auditTasks, fn ($t) => $t['on_time_status'] === 'on_time'));
        $lateCount = count(array_filter($auditTasks, fn ($t) => $t['on_time_status'] === 'late'));
        $overdueCount = count(array_filter($auditTasks, fn ($t) => $t['on_time_status'] === 'overdue'));

        $plannedSp = array_sum(array_column($auditTasks, 'original_sp'));
        $completedSp = array_sum(array_column(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed'), 'final_sp'));

        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;
        $onTimeRate = $completedTasks > 0 ? round(($onTimeCount / $completedTasks) * 100, 1) : 100;

        // Difficulty distribution
        $difficultyCounts = ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];
        foreach ($auditTasks as $at) {
            $d = $at['difficulty'] ?? 'Medium';
            if (isset($difficultyCounts[$d])) {
                $difficultyCounts[$d]++;
            }
        }

        // Story Points / Output Trend across Sprints
        $sprintOutputs = [];
        foreach ($tasks as $t) {
            $spName = $t->sprint?->name ?? 'Unassigned Sprint';
            if (! isset($sprintOutputs[$spName])) {
                $sprintOutputs[$spName] = [
                    'sprint_name' => $spName,
                    'assigned_sp' => 0,
                    'completed_sp' => 0,
                    'tasks_count' => 0,
                ];
            }
            $spVal = (int) ($t->story_points ?? 0);
            $sprintOutputs[$spName]['assigned_sp'] += $spVal;
            $sprintOutputs[$spName]['tasks_count']++;
            if ($t->status === 'completed') {
                $sprintOutputs[$spName]['completed_sp'] += $spVal;
            }
        }

        $title = $customTitle ?? "{$employee->name} — Employee Performance Report";
        $insight = "{$employee->name} maintains a {$completionRate}% task completion rate, having burned {$completedSp} Story Points with {$onTimeRate}% on-time turnaround.";

        return [
            'type' => 'individual_performance',
            'title' => $title,
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'role' => $employee->role ?? 'Member',
            ],
            'reporting_period' => $this->formatReportingPeriod($dateRange),
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'pending_tasks' => $pendingTasks,
            'on_time_tasks' => $onTimeCount,
            'late_tasks' => $lateCount,
            'overdue_tasks' => $overdueCount,
            'completion_rate' => $completionRate,
            'on_time_rate' => $onTimeRate,
            'planned_story_points' => $plannedSp,
            'completed_story_points' => $completedSp,
            'sp_completion_rate' => $plannedSp > 0 ? round(($completedSp / $plannedSp) * 100, 1) : 0,
            'difficulty_distribution' => $difficultyCounts,
            'sprint_trends' => array_values($sprintOutputs),
            'audit_tasks' => $auditTasks,
            'executive_insight' => $insight,
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 4. Team Performance Report
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildTeamPerformanceReport(?int $projectId, array $params, Collection $usersMap): ?array
    {
        $dateRange = $this->parseDateRange($params);
        $tasksQuery = Task::with(['project', 'sprint']);
        if ($projectId) {
            $tasksQuery->where('project_id', $projectId);
        }
        $this->applyDateRangeToTaskQuery($tasksQuery, $dateRange);
        $tasks = $tasksQuery->get();

        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        // Grouping by employee with clear scales
        $teamStats = [];
        foreach ($usersMap as $userId => $user) {
            $teamStats[$userId] = [
                'user_id' => $userId,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'Member',
                'assigned_count' => 0,
                'completed_count' => 0,
                'in_progress_count' => 0,
                'overdue_count' => 0,
                'completed_sp' => 0,
                'planned_sp' => 0,
            ];
        }

        // Add 'Unassigned' bucket
        $teamStats[0] = [
            'user_id' => 0,
            'name' => 'Unassigned',
            'email' => '',
            'role' => 'System',
            'assigned_count' => 0,
            'completed_count' => 0,
            'in_progress_count' => 0,
            'overdue_count' => 0,
            'completed_sp' => 0,
            'planned_sp' => 0,
        ];

        foreach ($auditTasks as $t) {
            $uid = (int) ($t['assigned_user_id'] ?? 0);
            if (! isset($teamStats[$uid])) {
                $teamStats[$uid] = [
                    'user_id' => $uid,
                    'name' => $t['assigned_employee'] ?? "User #{$uid}",
                    'email' => '',
                    'role' => 'Member',
                    'assigned_count' => 0,
                    'completed_count' => 0,
                    'in_progress_count' => 0,
                    'overdue_count' => 0,
                    'completed_sp' => 0,
                    'planned_sp' => 0,
                ];
            }

            $teamStats[$uid]['assigned_count']++;
            $teamStats[$uid]['planned_sp'] += (int) ($t['original_sp'] ?? 0);

            if ($t['status'] === 'completed') {
                $teamStats[$uid]['completed_count']++;
                $teamStats[$uid]['completed_sp'] += (int) ($t['final_sp'] ?? 0);
            } else {
                $teamStats[$uid]['in_progress_count']++;
                if ($t['on_time_status'] === 'overdue') {
                    $teamStats[$uid]['overdue_count']++;
                }
            }
        }

        // Filter out members with 0 tasks unless part of team
        $membersData = array_values(array_filter($teamStats, fn ($m) => $m['assigned_count'] > 0 || $m['user_id'] !== 0));

        // Alphabetical sort to avoid misleading rankings
        usort($membersData, fn ($a, $b) => strcmp($a['name'], $b['name']));

        $totalTasks = count($auditTasks);
        $totalCompleted = count(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed'));
        $projectName = $projectId ? Project::find($projectId)?->name : 'Workspace Wide';

        $insight = "Team overview across {$projectName}: {$totalCompleted} tasks completed out of {$totalTasks} total tasks assigned across ".count($membersData).' active member profiles.';

        return [
            'type' => 'team_performance',
            'title' => "{$projectName} — Team Performance Report",
            'project_name' => $projectName,
            'reporting_period' => $this->formatReportingPeriod($dateRange),
            'total_tasks' => $totalTasks,
            'completed_tasks' => $totalCompleted,
            'members_performance' => $membersData,
            'executive_insight' => $insight,
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 5. Task Audit and History Report
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildTaskAuditReport(?int $projectId, array $params, Collection $usersMap): ?array
    {
        $dateRange = $this->parseDateRange($params);
        $tasksQuery = Task::with(['project', 'sprint', 'assignee', 'completedBy']);
        if ($projectId) {
            $tasksQuery->where('project_id', $projectId);
        }
        if (! empty($params['sprint_id'])) {
            $tasksQuery->where('sprint_id', (int) $params['sprint_id']);
        }
        $this->applyDateRangeToTaskQuery($tasksQuery, $dateRange);
        $tasks = $tasksQuery->orderBy('created_at', 'desc')->get();

        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        // Fetch activity logs for these tasks
        $taskIds = $tasks->pluck('id')->all();
        $activityLogs = ActivityLog::where('subject_type', Task::class)
            ->whereIn('subject_id', $taskIds)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'task_id' => $log->subject_id,
                'field' => $log->field,
                'old_value' => $log->old_value,
                'new_value' => $log->new_value,
                'user_name' => $log->user_name,
                'created_at' => $log->created_at?->format('M d, Y g:i A') ?? '—',
            ])->all();

        $projectName = $projectId ? Project::find($projectId)?->name : 'Workspace Wide';

        return [
            'type' => 'task_audit',
            'title' => "{$projectName} — Task Audit & History Report",
            'project_name' => $projectName,
            'reporting_period' => $this->formatReportingPeriod($dateRange),
            'total_tasks' => count($auditTasks),
            'audit_tasks' => $auditTasks,
            'activity_logs' => $activityLogs,
            'executive_insight' => 'Comprehensive chronological timeline of task creation, state transitions, and story point revisions.',
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 6. Employee Workload and Assignment Report
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildWorkloadAssignmentReport(?int $projectId, array $params, Collection $usersMap): ?array
    {
        $dateRange = $this->parseDateRange($params);
        $tasksQuery = Task::with(['project', 'sprint']);
        if ($projectId) {
            $tasksQuery->where('project_id', $projectId);
        }
        $this->applyDateRangeToTaskQuery($tasksQuery, $dateRange);
        $tasks = $tasksQuery->get();

        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        // Workload distribution
        $allocation = [];
        foreach ($usersMap as $userId => $user) {
            $userTasks = array_filter($auditTasks, fn ($t) => (int) ($t['assigned_user_id'] ?? 0) === $userId);
            $activeTasks = array_filter($userTasks, fn ($t) => in_array($t['status'], ['todo', 'in_progress', 'review'], true));
            $criticalTasks = array_filter($activeTasks, fn ($t) => ($t['priority'] ?? '') === 'Critical');

            $allocation[] = [
                'user_id' => $userId,
                'name' => $user->name,
                'role' => $user->role ?? 'Member',
                'total_assigned' => count($userTasks),
                'active_workload' => count($activeTasks),
                'completed_workload' => count($userTasks) - count($activeTasks),
                'critical_active' => count($criticalTasks),
                'story_points_active' => array_sum(array_column($activeTasks, 'final_sp')),
            ];
        }

        // Sort by active workload descending to identify bottlenecks
        usort($allocation, fn ($a, $b) => $b['active_workload'] <=> $a['active_workload']);

        $projectName = $projectId ? Project::find($projectId)?->name : 'Workspace Wide';

        return [
            'type' => 'workload_assignment',
            'title' => "{$projectName} — Workload & Assignment Distribution",
            'project_name' => $projectName,
            'reporting_period' => $this->formatReportingPeriod($dateRange),
            'total_tasks' => count($auditTasks),
            'workload_allocation' => $allocation,
            'executive_insight' => 'Evaluates active capacity, bottlenecks, and critical-path allocations across members.',
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 7. Project Analytics Dashboard Report
     *
     * @return array<string, mixed>|null
     */
    private function buildProjectAnalyticsReport(?int $projectId, Collection $usersMap): ?array
    {
        $project = Project::with(['sprints', 'epics'])->find($projectId);
        if (! $project) {
            return null;
        }

        $tasks = Task::where('project_id', $project->id)->with(['sprint', 'assignee'])->get();
        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        $totalTasks = count($auditTasks);
        $completedTasks = count(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed'));
        $inProgressTasks = count(array_filter($auditTasks, fn ($t) => in_array($t['status'], ['in_progress', 'review'], true)));
        $todoTasks = count(array_filter($auditTasks, fn ($t) => $t['status'] === 'todo'));
        $overdueTasks = count(array_filter($auditTasks, fn ($t) => $t['on_time_status'] === 'overdue'));

        $plannedSp = array_sum(array_column($auditTasks, 'original_sp'));
        $completedSp = array_sum(array_column(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed'), 'final_sp'));

        // Status distribution
        $statusDistribution = [
            'completed' => $completedTasks,
            'in_progress' => $inProgressTasks,
            'todo' => $todoTasks,
            'overdue' => $overdueTasks,
        ];

        // Sprints comparison
        $sprintsData = $project->sprints->map(function ($sp) use ($auditTasks) {
            $spTasks = array_filter($auditTasks, fn ($t) => (int) ($t['sprint_id'] ?? 0) === $sp->id);
            $total = count($spTasks);
            $done = count(array_filter($spTasks, fn ($t) => $t['status'] === 'completed'));

            return [
                'name' => $sp->name,
                'planned_sp' => array_sum(array_column($spTasks, 'original_sp')),
                'completed_sp' => array_sum(array_column(array_filter($spTasks, fn ($t) => $t['status'] === 'completed'), 'final_sp')),
                'completion_rate' => $total > 0 ? round(($done / $total) * 100, 1) : 0,
            ];
        })->all();

        return [
            'type' => 'project_analytics',
            'title' => "{$project->name} — Project Analytics Dashboard",
            'project_id' => $project->id,
            'project_name' => $project->name,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'in_progress_tasks' => $inProgressTasks,
            'overdue_tasks' => $overdueTasks,
            'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
            'planned_story_points' => $plannedSp,
            'completed_story_points' => $completedSp,
            'status_distribution' => $statusDistribution,
            'sprints_comparison' => $sprintsData,
            'executive_insight' => "Project '{$project->name}' demonstrates active momentum across {$totalTasks} scoped tasks with {$overdueTasks} late items.",
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 8. My Tasks Report (Member)
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildMyTasksReport(int $userId, ?int $projectId, array $params, Collection $usersMap): ?array
    {
        $user = $usersMap->get($userId) ?? User::find($userId);
        if (! $user) {
            return null;
        }

        $dateRange = $this->parseDateRange($params);
        $tasksQuery = Task::where('assigned_user_id', $user->id)->with(['project', 'sprint']);
        if ($projectId) {
            $tasksQuery->where('project_id', $projectId);
        }
        $this->applyDateRangeToTaskQuery($tasksQuery, $dateRange);
        $tasks = $tasksQuery->orderBy('hard_constraint_date', 'asc')->get();

        $auditTasks = $this->transformTasksToAuditList($tasks, $usersMap);

        return [
            'type' => 'my_tasks',
            'title' => 'My Tasks Execution Report',
            'employee' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'reporting_period' => $this->formatReportingPeriod($dateRange),
            'total_tasks' => count($auditTasks),
            'completed_tasks' => count(array_filter($auditTasks, fn ($t) => $t['status'] === 'completed')),
            'in_progress_tasks' => count(array_filter($auditTasks, fn ($t) => in_array($t['status'], ['in_progress', 'review'], true))),
            'overdue_tasks' => count(array_filter($auditTasks, fn ($t) => $t['on_time_status'] === 'overdue')),
            'audit_tasks' => $auditTasks,
            'executive_insight' => 'Individual task inventory reflecting commitments, deadlines, and current workflow status.',
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 9. My Sprints Report (Member)
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildMySprintsReport(int $userId, ?int $projectId, array $params, Collection $usersMap): ?array
    {
        $user = $usersMap->get($userId) ?? User::find($userId);
        if (! $user) {
            return null;
        }

        $tasksQuery = Task::where('assigned_user_id', $user->id)->whereNotNull('sprint_id')->with('sprint');
        if ($projectId) {
            $tasksQuery->where('project_id', $projectId);
        }
        $tasks = $tasksQuery->get();

        $sprintGroups = [];
        foreach ($tasks as $t) {
            $sprint = $t->sprint;
            if (! $sprint) {
                continue;
            }
            if (! isset($sprintGroups[$sprint->id])) {
                $sprintGroups[$sprint->id] = [
                    'sprint_id' => $sprint->id,
                    'sprint_name' => $sprint->name,
                    'status' => $sprint->status,
                    'start_date' => $sprint->start_date?->format('M d, Y') ?? '—',
                    'end_date' => $sprint->end_date?->format('M d, Y') ?? '—',
                    'my_total_tasks' => 0,
                    'my_completed_tasks' => 0,
                    'my_story_points' => 0,
                    'tasks' => [],
                ];
            }

            $sprintGroups[$sprint->id]['my_total_tasks']++;
            $sprintGroups[$sprint->id]['my_story_points'] += (int) ($t->story_points ?? 0);
            if ($t->status === 'completed') {
                $sprintGroups[$sprint->id]['my_completed_tasks']++;
            }

            $sprintGroups[$sprint->id]['tasks'][] = [
                'id' => $t->id,
                'title' => $t->title,
                'status' => $t->status,
                'story_points' => (int) ($t->story_points ?? 0),
            ];
        }

        return [
            'type' => 'my_sprints',
            'title' => 'My Sprint Contributions Report',
            'employee' => ['id' => $user->id, 'name' => $user->name],
            'sprints' => array_values($sprintGroups),
            'total_sprints' => count($sprintGroups),
            'executive_insight' => 'Summary of sprint deliverables and story points delivered across assigned milestones.',
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 10. My Task Activity History (Member)
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildMyTaskActivityReport(int $userId, array $params): ?array
    {
        $user = User::find($userId);
        if (! $user) {
            return null;
        }

        $myTaskIds = Task::where('assigned_user_id', $user->id)->pluck('id')->all();

        $logsQuery = ActivityLog::where('subject_type', Task::class)
            ->where(function ($q) use ($user, $myTaskIds) {
                $q->where('user_id', $user->id)
                    ->orWhereIn('subject_id', $myTaskIds);
            })
            ->orderBy('created_at', 'desc')
            ->limit(100);

        $dateRange = $this->parseDateRange($params);
        if ($dateRange['start']) {
            $logsQuery->where('created_at', '>=', $dateRange['start']);
        }
        if ($dateRange['end']) {
            $logsQuery->where('created_at', '<=', $dateRange['end']);
        }

        $logs = $logsQuery->get()->map(fn ($l) => [
            'id' => $l->id,
            'task_id' => $l->subject_id,
            'field' => $l->field,
            'old_value' => $l->old_value,
            'new_value' => $l->new_value,
            'user_name' => $l->user_name,
            'created_at' => $l->created_at?->format('M d, Y g:i A') ?? '—',
        ])->all();

        return [
            'type' => 'my_task_activity',
            'title' => 'My Task Activity & Audit Trail',
            'employee' => ['id' => $user->id, 'name' => $user->name],
            'reporting_period' => $this->formatReportingPeriod($dateRange),
            'activity_logs' => $logs,
            'total_events' => count($logs),
            'executive_insight' => 'Verified activity logs recording task lifecycle mutations and estimate updates.',
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }

    /**
     * 11. My Progress and Analytics Report (Member)
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>|null
     */
    private function buildMyProgressAnalyticsReport(int $userId, array $params, Collection $usersMap): ?array
    {
        return $this->buildIndividualPerformanceReport($userId, null, $params, $usersMap, 'My Progress & Analytics Report');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // UTILITY METHODS
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Transform a collection of Eloquent Task models into sanitized audit rows with verified Story Points.
     *
     * @param  Collection<int, Task>  $tasks
     * @return array<array<string, mixed>>
     */
    public function transformTasksToAuditList(Collection $tasks, Collection $usersMap): array
    {
        $today = Carbon::today();
        $audit = [];

        // Pre-fetch activity logs for initial story point detection
        $taskIds = $tasks->pluck('id')->all();
        $genesisLogs = [];
        if (! empty($taskIds)) {
            $logs = DB::table('activity_logs')
                ->where('subject_type', Task::class)
                ->whereIn('subject_id', $taskIds)
                ->where('field', 'story_points')
                ->orderBy('created_at', 'asc')
                ->get();
            foreach ($logs as $l) {
                if (! isset($genesisLogs[$l->subject_id])) {
                    $genesisLogs[$l->subject_id] = (int) $l->new_value;
                }
            }
        }

        // Fetch assignments
        $assignmentsByTask = [];
        if (Schema::hasTable('assignments') && ! empty($taskIds)) {
            $assigns = DB::table('assignments')->whereIn('task_id', $taskIds)->get();
            foreach ($assigns as $a) {
                if (! isset($assignmentsByTask[$a->task_id])) {
                    $assignmentsByTask[$a->task_id] = $a;
                }
            }
        }

        foreach ($tasks as $task) {
            $isCompleted = ($task->status === 'completed' || $task->sprint_status === 'done');
            $spFinal = (int) ($task->story_points ?? 0);
            $spOriginal = $genesisLogs[$task->id] ?? $spFinal;
            $spDiff = $spFinal - $spOriginal;

            $assigneeId = $task->assigned_user_id;
            $assignee = $assigneeId && $usersMap->has($assigneeId) ? $usersMap->get($assigneeId) : null;
            $assigneeName = $assignee ? $assignee->name : ($assigneeId ? "User #{$assigneeId}" : 'Unassigned');

            $completedById = $task->completed_by_user_id ?? ($isCompleted ? $assigneeId : null);
            $completedBy = $completedById && $usersMap->has($completedById) ? $usersMap->get($completedById) : null;
            $completedByName = $completedBy ? $completedBy->name : ($isCompleted ? $assigneeName : '—');

            $assignmentRecord = $assignmentsByTask[$task->id] ?? null;
            $assignedDate = $assignmentRecord ? Carbon::parse($assignmentRecord->assigned_at) : ($task->created_at ?? null);

            $deadline = null;
            if ($task->hard_constraint_date) {
                $deadline = Carbon::parse($task->hard_constraint_date);
            } elseif ($task->sprint?->end_date) {
                $deadline = Carbon::parse($task->sprint->end_date);
            } elseif ($task->project?->target_end_date) {
                $deadline = Carbon::parse($task->project->target_end_date);
            }

            $completedDate = $task->completed_at ? Carbon::parse($task->completed_at) : ($isCompleted ? ($task->updated_at ?? null) : null);

            $onTimeStatus = 'in_progress';
            $delayDays = 0;

            if ($isCompleted) {
                if ($deadline && $completedDate) {
                    if ($completedDate->startOfDay()->gt($deadline->startOfDay())) {
                        $onTimeStatus = 'late';
                        $delayDays = $completedDate->startOfDay()->diffInDays($deadline->startOfDay());
                    } else {
                        $onTimeStatus = 'on_time';
                    }
                } else {
                    $onTimeStatus = 'on_time';
                }
            } else {
                if ($deadline && $today->gt($deadline->startOfDay())) {
                    $onTimeStatus = 'overdue';
                    $delayDays = $today->diffInDays($deadline->startOfDay());
                } else {
                    $onTimeStatus = 'in_progress';
                }
            }

            $audit[] = [
                'id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
                'project_name' => $task->project?->name ?? 'Project',
                'sprint_id' => $task->sprint_id,
                'sprint_name' => $task->sprint?->name ?? '—',
                'classification' => $task->task_classification ?: 'Feature',
                'assigned_employee' => $assigneeName,
                'assigned_user_id' => $assigneeId,
                'completed_by_employee' => $completedByName,
                'status' => $task->status,
                'assigned_date' => $assignedDate ? $assignedDate->format('M d, Y') : '—',
                'deadline' => $deadline ? $deadline->format('M d, Y') : '—',
                'completed_date' => $completedDate ? $completedDate->format('M d, Y') : '—',
                'on_time_status' => $onTimeStatus,
                'delay_days' => $delayDays,
                'original_sp' => $spOriginal,
                'final_sp' => $spFinal,
                'sp_difference' => $spDiff,
                'priority' => ucfirst(strtolower($task->priority ?? 'Medium')),
                'difficulty' => ucfirst(strtolower($task->task_difficulty ?? 'Medium')),
                'is_critical' => (bool) ($task->is_critical || $task->total_float === 0),
            ];
        }

        return $audit;
    }

    /**
     * Parse date range filters.
     *
     * @param  array<string, mixed>  $params
     * @return array{start: ?Carbon, end: ?Carbon}
     */
    private function parseDateRange(array $params): array
    {
        $start = ! empty($params['start_date']) ? Carbon::parse($params['start_date'])->startOfDay() : null;
        $end = ! empty($params['end_date']) ? Carbon::parse($params['end_date'])->endOfDay() : null;

        return ['start' => $start, 'end' => $end];
    }

    /**
     * Apply date range filtering to task query.
     *
     * @param  array{start: ?Carbon, end: ?Carbon}  $dateRange
     */
    private function applyDateRangeToTaskQuery($query, array $dateRange): void
    {
        if ($dateRange['start']) {
            $query->where('created_at', '>=', $dateRange['start']);
        }
        if ($dateRange['end']) {
            $query->where('created_at', '<=', $dateRange['end']);
        }
    }

    /**
     * Format human-readable reporting period string.
     *
     * @param  array{start: ?Carbon, end: ?Carbon}  $dateRange
     */
    private function formatReportingPeriod(array $dateRange, ?string $fallbackStart = null, ?string $fallbackEnd = null): string
    {
        if ($dateRange['start'] && $dateRange['end']) {
            return $dateRange['start']->format('M d, Y').' – '.$dateRange['end']->format('M d, Y');
        }
        if ($dateRange['start']) {
            return 'Since '.$dateRange['start']->format('M d, Y');
        }
        if ($dateRange['end']) {
            return 'Up to '.$dateRange['end']->format('M d, Y');
        }
        if ($fallbackStart && $fallbackEnd) {
            return "{$fallbackStart} – {$fallbackEnd}";
        }

        return 'All Historical Workspace Records';
    }
}
