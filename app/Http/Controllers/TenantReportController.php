<?php

namespace App\Http\Controllers;

use App\Mail\ReportSharedMail;
use App\Models\Studio;
use App\Services\ReportPdfGenerator;
use App\Models\Tenant\ChannelMessage;
use App\Models\Tenant\Project;
use App\Models\Tenant\Report;
use App\Models\Tenant\Sprint;
use App\Models\Tenant\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantReportController extends Controller
{
    /**
     * Display the Reports & Analytics dashboard.
     */
    public function index(Request $request): Response
    {
        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $studio = Studio::find($tenantId);

        $projects = Project::with(['sprints' => function ($q) {
            $q->orderBy('start_date', 'asc');
        }])
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'status', 'start_date', 'target_end_date']);

        $selectedProjectId = $request->query('project_id') ? (int) $request->query('project_id') : ($projects->first()?->id ?? null);
        $selectedSprintId = $request->query('sprint_id'); // can be null, integer, or 'all'

        $initialReportData = null;
        if ($selectedProjectId) {
            $initialReportData = $this->calculateReportMetrics(
                $selectedProjectId,
                $selectedSprintId === 'all' || ! $selectedSprintId ? null : (int) $selectedSprintId,
                $selectedSprintId === 'all' ? 'project' : ($selectedSprintId ? 'sprint' : 'sprint')
            );
        }

        $teamMembers = [];
        if ($studio) {
            try {
                $teamMembers = $studio->users()->get()->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                ])->all();
            } catch (\Throwable $e) {
                // Fallback
            }
        }

        return Inertia::render('Tenant/Reports/Index', [
            'studio' => [
                'id' => $studio ? $studio->id : $tenantId,
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'projects' => $projects,
            'teamMembers' => $teamMembers,
            'initialProjectId' => $selectedProjectId,
            'initialSprintId' => $selectedSprintId,
            'initialReportData' => $initialReportData,
        ]);
    }

    /**
     * Fetch calculated metrics dynamically via AJAX for selected project/sprint.
     */
    public function getReportData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer',
            'sprint_id' => 'nullable',
            'scope' => 'nullable|string|in:sprint,project',
        ]);

        $projectId = (int) $validated['project_id'];
        $sprintIdRaw = $validated['sprint_id'] ?? null;
        $scope = $validated['scope'] ?? ($sprintIdRaw === 'all' ? 'project' : 'sprint');

        $sprintId = ($sprintIdRaw === 'all' || ! $sprintIdRaw) ? null : (int) $sprintIdRaw;

        $reportData = $this->calculateReportMetrics($projectId, $sprintId, $scope);

        if (! $reportData) {
            return response()->json(['message' => 'Project or sprint not found.'], 404);
        }

        return response()->json([
            'data' => $reportData,
        ]);
    }

    /**
     * Share report directly via email.
     */
    public function shareEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'recipient_email' => 'required|email',
            'project_id' => 'nullable|integer',
            'sprint_id' => 'nullable',
            'scope' => 'nullable|string|in:sprint,project,team,schedule',
            'archived_report_id' => 'nullable|integer',
            'personal_note' => 'nullable|string|max:1000',
            'pdf_base64' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $user = $request->user();
        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $studio = Studio::find($tenantId);
        $studioName = $studio?->name ?? 'SprintStudio';

        if (! empty($validated['archived_report_id'])) {
            $archivedReport = Report::find($validated['archived_report_id']);
            if (! $archivedReport) {
                return response()->json(['message' => 'Archived report could not be found.'], 404);
            }

            $reportData = $archivedReport->metrics ?? [];
            $reportTitle = $archivedReport->name ?: ($reportData['title'] ?? 'Archived Report');
            $reportData['title'] = $reportTitle;
            $reportData['scope'] = $archivedReport->type ?: ($reportData['scope'] ?? 'project');
            $reportData['project_name'] = $archivedReport->target_name ?: ($reportData['project_name'] ?? 'Workspace');
            $scope = $reportData['scope'];
            $reportUrl = url("/studio/{$tenantId}/docs");
        } else {
            $projectId = (int) ($validated['project_id'] ?? 0);
            if (! $projectId) {
                return response()->json(['message' => 'Please provide a valid project or archived report.'], 422);
            }
            $sprintIdRaw = $validated['sprint_id'] ?? null;
            $scope = $validated['scope'] ?? ($sprintIdRaw === 'all' ? 'project' : 'sprint');
            $sprintId = ($sprintIdRaw === 'all' || ! $sprintIdRaw) ? null : (int) $sprintIdRaw;

            $reportData = $this->calculateReportMetrics($projectId, $sprintId, $scope);
            if (! $reportData) {
                return response()->json(['message' => 'Report could not be generated for this scope.'], 404);
            }

            $reportTitle = $reportData['title'] ?? 'Performance Report';
            $reportUrl = url("/studio/{$tenantId}/reports?project_id={$projectId}&sprint_id=".($sprintId ?? 'all'));
        }

        $cleanSlug = Str::slug($reportTitle ?: 'performance-report').'-'.now()->format('Y-m-d');
        $pdfFilename = "{$cleanSlug}.pdf";
        $csvFilename = "{$cleanSlug}.csv";

        // 1. Generate full CSV audit data string
        $csvContent = $this->generateCsvString($reportData);

        // 2. Check for optional client-rendered PDF base64, fallback to backend PDF generator
        $pdfContent = null;
        if (! empty($validated['pdf_base64'])) {
            $rawB64 = preg_replace('#^data:application/pdf;base64,#i', '', $validated['pdf_base64']);
            $decoded = base64_decode($rawB64, true);
            if ($decoded !== false && strlen($decoded) > 100) {
                $pdfContent = $decoded;
            }
        }
        if (! $pdfContent) {
            $pdfContent = ReportPdfGenerator::generate($reportData, $studioName, $user->name);
        }

        try {
            Mail::to($validated['recipient_email'])->send(
                new ReportSharedMail(
                    senderName: $user->name,
                    reportTitle: $reportTitle,
                    scopeType: $scope,
                    studioName: $studioName,
                    reportUrl: $reportUrl,
                    personalNote: $validated['personal_note'] ?? null,
                    reportData: $reportData,
                    pdfContent: $pdfContent,
                    csvContent: $csvContent,
                    pdfFilename: $pdfFilename,
                    csvFilename: $csvFilename
                )
            );

            return response()->json([
                'success' => true,
                'message' => "Report with both PDF and CSV attachments was successfully sent to {$validated['recipient_email']}.",
            ]);
        } catch (\Throwable $e) {
            \Log::error('Report email delivery failed: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to send email right now. Please verify the recipient address or try again in a few moments.',
            ], 500);
        }
    }

    /**
     * Share report directly into an in-system DM or channel.
     */
    public function shareChat(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'recipient_type' => 'required|string|in:dm,channel',
            'recipient_id' => 'required|string', // user ID (int) or channel key (string)
            'project_id' => 'required|integer',
            'sprint_id' => 'nullable',
            'scope' => 'nullable|string|in:sprint,project',
            'personal_note' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $user = $request->user();
        $tenantId = tenant('id') ?? (string) $request->route('tenant');

        $projectId = (int) $validated['project_id'];
        $sprintIdRaw = $validated['sprint_id'] ?? null;
        $scope = $validated['scope'] ?? ($sprintIdRaw === 'all' ? 'project' : 'sprint');
        $sprintId = ($sprintIdRaw === 'all' || ! $sprintIdRaw) ? null : (int) $sprintIdRaw;

        $reportData = $this->calculateReportMetrics($projectId, $sprintId, $scope);
        if (! $reportData) {
            return response()->json(['message' => 'Report not found.'], 404);
        }

        // Determine channel ID
        $channelId = '';
        $mentions = [];
        if ($validated['recipient_type'] === 'dm') {
            $otherUserId = (int) $validated['recipient_id'];
            $first = min((int) $user->id, $otherUserId);
            $second = max((int) $user->id, $otherUserId);
            $channelId = "dm-{$first}_{$second}";
            $mentions = [$otherUserId];
        } else {
            $channelId = $validated['recipient_id'];
        }

        $reportTitle = $reportData['title'] ?? 'Performance Report';
        $body = "📊 Shared a Report: {$reportTitle}";
        if (! empty($validated['personal_note'])) {
            $body .= "\nNote: ".trim($validated['personal_note']);
        }

        $reportAttachment = [
            'type' => 'report',
            'name' => "{$reportTitle}.pdf",
            'report_title' => $reportTitle,
            'scope' => $scope,
            'project_name' => $reportData['project_name'] ?? 'Project',
            'sprint_name' => $reportData['sprint_name'] ?? null,
            'completion_rate' => $reportData['completion_rate'] ?? 0,
            'total_tasks' => $reportData['total_tasks'] ?? 0,
            'completed_tasks' => $reportData['completed_tasks'] ?? 0,
            'completed_story_points' => $reportData['completed_story_points'] ?? 0,
            'planned_story_points' => $reportData['planned_story_points'] ?? 0,
            'report_url' => "/studio/{$tenantId}/reports?project_id={$projectId}&sprint_id=".($sprintId ?? 'all'),
        ];

        // Resolve sender role in studio
        $member = null;
        try {
            $member = DB::connection(config('tenancy.database.central_connection', 'central'))
                ->table('studio_members')
                ->where('studio_id', $tenantId)
                ->where('user_id', $user->id)
                ->first();
        } catch (\Throwable $e) {
            // Ignore
        }
        $role = $member?->role ?? ($user->role === User::ROLE_ADMIN ? 'leader' : 'member');

        $message = ChannelMessage::create([
            'channel_id' => $channelId,
            'user_id' => $user->id,
            'sender_name' => $user->name,
            'sender_role' => ucfirst($role),
            'body' => $body,
            'attachments' => [$reportAttachment],
            'mentions' => $mentions,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report shared successfully in chat.',
            'channel_message' => $message,
        ], 201);
    }

    /**
     * Generate raw CSV string from report data array.
     *
     * @param  array<string, mixed>  $report
     */
    public function generateCsvString(array $report): string
    {
        $handle = fopen('php://temp', 'r+');

        // Header summary
        fputcsv($handle, ['SPRINTSTUDIO - '.strtoupper($report['scope'] ?? 'SPRINT').' REPORT']);
        fputcsv($handle, ['Report Title', $report['title'] ?? '']);
        fputcsv($handle, ['Project', $report['project_name'] ?? '']);
        if (! empty($report['sprint_name'])) {
            fputcsv($handle, ['Sprint', $report['sprint_name']]);
            fputcsv($handle, ['Sprint Duration', ($report['start_date'] ?? '').' to '.($report['end_date'] ?? '')]);
        }
        fputcsv($handle, ['Generated At', now()->toDateTimeString()]);
        fputcsv($handle, []);

        // Overall KPIs
        fputcsv($handle, ['KEY PERFORMANCE INDICATORS']);
        fputcsv($handle, ['Total Tasks', $report['total_tasks'] ?? 0]);
        fputcsv($handle, ['Completed Tasks', $report['completed_tasks'] ?? 0]);
        fputcsv($handle, ['Unfinished Tasks', $report['unfinished_tasks'] ?? 0]);
        fputcsv($handle, ['Overdue Tasks', $report['overdue_tasks'] ?? 0]);
        fputcsv($handle, ['Completion Rate', ($report['completion_rate'] ?? 0).'%']);
        fputcsv($handle, ['Planned Story Points', $report['planned_story_points'] ?? 0]);
        fputcsv($handle, ['Completed Story Points', $report['completed_story_points'] ?? 0]);
        fputcsv($handle, ['Story Points Completion', ($report['sp_completion_rate'] ?? 0).'%']);
        fputcsv($handle, []);

        // Audit Table
        $audit = $report['audit_tasks'] ?? ($report['tasks_list'] ?? []);
        if (! empty($audit)) {
            fputcsv($handle, ['TASK AUDIT BREAKDOWN']);
            fputcsv($handle, [
                'Task ID',
                'Task Title',
                'Assigned To',
                'Completed By',
                'Status',
                'Assigned Date',
                'Deadline',
                'Completion Date',
                'On-Time Status',
                'Estimated SP',
                'Final SP',
                'SP Difference',
                'Priority',
                'Difficulty',
            ]);

            foreach ($audit as $task) {
                fputcsv($handle, [
                    $task['id'] ?? '—',
                    $task['title'] ?? '—',
                    $task['assigned_employee'] ?? ($task['assignee'] ?? 'Unassigned'),
                    $task['completed_by_employee'] ?? '—',
                    $task['status'] ?? '—',
                    $task['assigned_date'] ?? '—',
                    $task['deadline'] ?? '—',
                    $task['completed_date'] ?? '—',
                    $task['on_time_status'] ?? (! empty($task['is_critical']) ? 'Critical' : 'Standard'),
                    $task['original_sp'] ?? ($task['estimated_hours'] ?? 0),
                    $task['final_sp'] ?? 0,
                    $task['sp_difference'] ?? 0,
                    $task['priority'] ?? 'Medium',
                    $task['difficulty'] ?? 'Medium',
                ]);
            }
            fputcsv($handle, []);
        }

        // Employee Performance
        $team = $report['employee_performance'] ?? [];
        if (! empty($team)) {
            fputcsv($handle, ['EMPLOYEE PERFORMANCE SUMMARY']);
            fputcsv($handle, [
                'Employee',
                'Assigned Tasks',
                'Completed Tasks',
                'Unfinished Tasks',
                'Completion Rate',
                'Completed SP',
                'Avg SP / Task',
                'On-Time Tasks',
                'Overdue Tasks',
                'Sprint Contribution %',
            ]);

            foreach ($team as $emp) {
                fputcsv($handle, [
                    $emp['name'],
                    $emp['assigned_count'],
                    $emp['completed_count'],
                    $emp['unfinished_count'],
                    $emp['completion_rate'].'%',
                    $emp['completed_sp'],
                    $emp['avg_sp_per_task'],
                    $emp['on_time_count'],
                    $emp['overdue_count'],
                    $emp['contribution_pct'].'%',
                ]);
            }
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv ?: '';
    }

    /**
     * Export report data as clean CSV.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $projectId = (int) $request->query('project_id');
        $sprintIdRaw = $request->query('sprint_id');
        $scope = $request->query('scope', ($sprintIdRaw === 'all' ? 'project' : 'sprint'));
        $sprintId = ($sprintIdRaw === 'all' || ! $sprintIdRaw) ? null : (int) $sprintIdRaw;

        $report = $this->calculateReportMetrics($projectId, $sprintId, $scope);
        $filename = Str::slug(($report['title'] ?? 'report').'-'.now()->format('Y-m-d')).'.csv';
        $csvContent = $this->generateCsvString($report);

        return response()->streamDownload(function () use ($csvContent) {
            echo $csvContent;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Compute all metrics for a given project and optional sprint.
     *
     * @return array<string, mixed>|null
     */
    public function calculateReportMetrics(int $projectId, ?int $sprintId = null, string $scope = 'sprint'): ?array
    {
        $project = Project::with(['sprints' => function ($q) {
            $q->orderBy('start_date', 'asc');
        }])->find($projectId);

        if (! $project) {
            return null;
        }

        // Users map for central lookup
        $studio = Studio::find(tenant('id'));
        $users = [];
        try {
            $users = $studio ? $studio->users()->get()->keyBy('id') : collect([]);
        } catch (\Throwable $e) {
            $users = collect([]);
        }

        // If sprint scope is requested but no sprint is selected, pick active or first sprint
        $sprint = null;
        if ($scope === 'sprint') {
            if ($sprintId) {
                $sprint = Sprint::where('project_id', $project->id)->find($sprintId);
            }
            if (! $sprint) {
                $sprint = Sprint::where('project_id', $project->id)->where('status', 'active')->first()
                    ?? Sprint::where('project_id', $project->id)->first();
            }

            if (! $sprint) {
                // Fallback to project scope if no sprint exists in project
                $scope = 'project';
            }
        }

        // Tasks query
        $tasksQuery = Task::where('project_id', $project->id)->with(['epic']);
        if ($scope === 'sprint' && $sprint) {
            $tasksQuery->where('sprint_id', $sprint->id);
        }

        $tasks = $tasksQuery->get();

        // Fetch assignments for these tasks to obtain assignment dates
        $assignmentsByTask = [];
        if (Schema::hasTable('assignments')) {
            $taskIds = $tasks->pluck('id')->all();
            if (! empty($taskIds)) {
                $assignments = DB::table('assignments')->whereIn('task_id', $taskIds)->get();
                foreach ($assignments as $a) {
                    if (! isset($assignmentsByTask[$a->task_id])) {
                        $assignmentsByTask[$a->task_id] = $a;
                    }
                }
            }
        }

        $today = Carbon::today();

        // 1. Process tasks into audit rows
        $auditTasks = [];
        $completedCount = 0;
        $unfinishedCount = 0;
        $overdueCount = 0;
        $onTimeCount = 0;
        $lateCompletedCount = 0;

        $priorityCounts = ['Low' => 0, 'Medium' => 0, 'High' => 0, 'Critical' => 0];
        $difficultyCounts = ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];

        $plannedSp = 0;
        $completedSp = 0;

        // Grouping per employee
        $employeeStats = [];

        foreach ($tasks as $task) {
            $isCompleted = ($task->status === 'completed' || $task->sprint_status === 'done');
            $spOriginal = (int) ($task->story_points ?? 0);
            $spFinal = (int) ($task->actual_story_points ?? $spOriginal);
            $spDiff = $spFinal - $spOriginal;

            $plannedSp += $spOriginal;
            if ($isCompleted) {
                $completedSp += $spFinal;
            }

            // Priority & Difficulty normalization
            $priority = ucfirst(strtolower($task->priority ?? $task->sprint_priority ?? 'Medium'));
            if (! isset($priorityCounts[$priority])) {
                $priority = 'Medium';
            }
            $priorityCounts[$priority]++;

            $difficulty = ucfirst(strtolower($task->task_difficulty ?? 'Medium'));
            if (! isset($difficultyCounts[$difficulty])) {
                $difficulty = 'Medium';
            }
            $difficultyCounts[$difficulty]++;

            // Assigned employee resolution
            $assigneeId = $task->assigned_user_id;
            $assignee = $assigneeId && isset($users[$assigneeId]) ? $users[$assigneeId] : null;
            $assigneeName = $assignee ? $assignee->name : ($assigneeId ? "User #{$assigneeId}" : 'Unassigned');

            // Completed by employee resolution
            $completedById = $task->completed_by_user_id ?? ($isCompleted ? $assigneeId : null);
            $completedBy = $completedById && isset($users[$completedById]) ? $users[$completedById] : null;
            $completedByName = $completedBy ? $completedBy->name : ($completedById ? "User #{$completedById}" : ($isCompleted ? $assigneeName : null));

            // Dates & On-Time Status
            $assignmentRecord = $assignmentsByTask[$task->id] ?? null;
            $assignedDate = $assignmentRecord ? Carbon::parse($assignmentRecord->assigned_at) : ($task->created_at ?? null);

            // Deadline calculation
            $deadline = null;
            if ($task->hard_constraint_date) {
                $deadline = Carbon::parse($task->hard_constraint_date);
            } elseif ($task->days_until_deadline !== null && $assignedDate) {
                $deadline = $assignedDate->copy()->addDays((int) $task->days_until_deadline);
            } elseif ($sprint && $sprint->end_date) {
                $deadline = Carbon::parse($sprint->end_date);
            } elseif ($project->target_end_date) {
                $deadline = Carbon::parse($project->target_end_date);
            }

            // Completed date
            $completedDate = $task->completed_at ? Carbon::parse($task->completed_at) : ($isCompleted ? ($task->updated_at ?? null) : null);

            $onTimeStatus = 'on_track';
            $delayDays = 0;

            if ($isCompleted) {
                $completedCount++;
                if ($deadline && $completedDate) {
                    if ($completedDate->startOfDay()->gt($deadline->startOfDay())) {
                        $onTimeStatus = 'late';
                        $delayDays = $completedDate->startOfDay()->diffInDays($deadline->startOfDay());
                        $lateCompletedCount++;
                    } else {
                        $onTimeStatus = 'on_time';
                        $onTimeCount++;
                    }
                } else {
                    $onTimeStatus = 'on_time';
                    $onTimeCount++;
                }
            } else {
                $unfinishedCount++;
                if ($deadline && $today->gt($deadline->startOfDay())) {
                    $onTimeStatus = 'overdue';
                    $delayDays = $today->diffInDays($deadline->startOfDay());
                    $overdueCount++;
                } else {
                    $onTimeStatus = 'in_progress';
                }
            }

            // Accumulate employee factual metrics
            $targetEmpId = $assigneeId ?? 0;
            $targetEmpName = $assigneeName;

            if (! isset($employeeStats[$targetEmpId])) {
                $employeeStats[$targetEmpId] = [
                    'user_id' => $targetEmpId,
                    'name' => $targetEmpName,
                    'role' => $assignee?->role ?? 'Member',
                    'assigned_count' => 0,
                    'completed_count' => 0,
                    'unfinished_count' => 0,
                    'on_time_count' => 0,
                    'late_count' => 0,
                    'overdue_count' => 0,
                    'planned_sp' => 0,
                    'completed_sp' => 0,
                    'difficulty_counts' => ['Easy' => 0, 'Medium' => 0, 'Hard' => 0],
                ];
            }

            $employeeStats[$targetEmpId]['assigned_count']++;
            $employeeStats[$targetEmpId]['planned_sp'] += $spOriginal;
            $employeeStats[$targetEmpId]['difficulty_counts'][$difficulty]++;

            if ($isCompleted) {
                $employeeStats[$targetEmpId]['completed_count']++;
                $employeeStats[$targetEmpId]['completed_sp'] += $spFinal;
                if ($onTimeStatus === 'late') {
                    $employeeStats[$targetEmpId]['late_count']++;
                } else {
                    $employeeStats[$targetEmpId]['on_time_count']++;
                }
            } else {
                $employeeStats[$targetEmpId]['unfinished_count']++;
                if ($onTimeStatus === 'overdue') {
                    $employeeStats[$targetEmpId]['overdue_count']++;
                }
            }

            $auditTasks[] = [
                'id' => $task->id,
                'title' => $task->title,
                'classification' => $task->task_classification ?: 'General',
                'assigned_employee' => $assigneeName,
                'assigned_user_id' => $assigneeId,
                'completed_by_employee' => $completedByName,
                'status' => $task->status,
                'sprint_status' => $task->sprint_status ?: ($isCompleted ? 'done' : 'ready_to_start'),
                'assigned_date' => $assignedDate ? $assignedDate->format('M d, Y') : '—',
                'deadline' => $deadline ? $deadline->format('M d, Y') : '—',
                'completed_date' => $completedDate ? $completedDate->format('M d, Y') : '—',
                'on_time_status' => $onTimeStatus,
                'delay_days' => $delayDays,
                'original_sp' => $spOriginal,
                'final_sp' => $spFinal,
                'sp_difference' => $spDiff,
                'priority' => $priority,
                'difficulty' => $difficulty,
                'github_link' => $task->github_link,
            ];
        }

        $totalTasks = count($tasks);
        $completionRate = $totalTasks > 0 ? round(($completedCount / $totalTasks) * 100, 1) : 0;
        $spCompletionRate = $plannedSp > 0 ? round(($completedSp / $plannedSp) * 100, 1) : 0;

        // Factual Employee Performance Table computation
        $employeePerformance = [];
        foreach ($employeeStats as $emp) {
            $assigned = $emp['assigned_count'];
            $done = $emp['completed_count'];
            $empCompletionRate = $assigned > 0 ? round(($done / $assigned) * 100, 1) : 0;
            $avgSp = $done > 0 ? round($emp['completed_sp'] / $done, 1) : 0;
            $contributionPct = $completedCount > 0 ? round(($done / $completedCount) * 100, 1) : 0;

            $employeePerformance[] = [
                'user_id' => $emp['user_id'],
                'name' => $emp['name'],
                'role' => $emp['role'],
                'assigned_count' => $assigned,
                'completed_count' => $done,
                'unfinished_count' => $emp['unfinished_count'],
                'completion_rate' => $empCompletionRate,
                'planned_sp' => $emp['planned_sp'],
                'completed_sp' => $emp['completed_sp'],
                'avg_sp_per_task' => $avgSp,
                'on_time_count' => $emp['on_time_count'],
                'late_count' => $emp['late_count'],
                'overdue_count' => $emp['overdue_count'],
                'difficulty_counts' => $emp['difficulty_counts'],
                'contribution_pct' => $contributionPct,
            ];
        }

        // Sort employee performance alphabetically to avoid subjective ranking
        usort($employeePerformance, fn ($a, $b) => strcmp($a['name'], $b['name']));

        // Sprint-by-sprint breakdown (for Project Scope)
        $sprintsBreakdown = [];
        if ($scope === 'project') {
            foreach ($project->sprints as $sp) {
                $spTasks = Task::where('sprint_id', $sp->id)->get();
                $spTotal = $spTasks->count();
                $spDone = $spTasks->where('status', 'completed')->count();
                $spPlannedSp = $spTasks->sum('story_points');
                $spCompletedSp = $spTasks->where('status', 'completed')->sum(fn ($t) => $t->actual_story_points ?? $t->story_points);

                $sprintsBreakdown[] = [
                    'id' => $sp->id,
                    'name' => $sp->name,
                    'status' => $sp->status,
                    'start_date' => $sp->start_date ? Carbon::parse($sp->start_date)->format('M d, Y') : '—',
                    'end_date' => $sp->end_date ? Carbon::parse($sp->end_date)->format('M d, Y') : '—',
                    'total_tasks' => $spTotal,
                    'completed_tasks' => $spDone,
                    'unfinished_tasks' => $spTotal - $spDone,
                    'planned_sp' => $spPlannedSp,
                    'completed_sp' => $spCompletedSp,
                    'completion_rate' => $spTotal > 0 ? round(($spDone / $spTotal) * 100, 1) : 0,
                ];
            }
        }

        $title = $scope === 'sprint' && $sprint
            ? "{$project->name} — {$sprint->name} Performance Report"
            : "{$project->name} — Full Project Analytics Report";

        return [
            'scope' => $scope,
            'title' => $title,
            'project_id' => $project->id,
            'project_name' => $project->name,
            'project_status' => $project->status,
            'sprint_id' => $sprint?->id,
            'sprint_name' => $sprint?->name,
            'sprint_goal' => $sprint?->goal,
            'sprint_status' => $sprint?->status,
            'start_date' => $sprint?->start_date ? Carbon::parse($sprint->start_date)->format('M d, Y') : ($project->start_date ? Carbon::parse($project->start_date)->format('M d, Y') : '—'),
            'end_date' => $sprint?->end_date ? Carbon::parse($sprint->end_date)->format('M d, Y') : ($project->target_end_date ? Carbon::parse($project->target_end_date)->format('M d, Y') : '—'),
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedCount,
            'unfinished_tasks' => $unfinishedCount,
            'overdue_tasks' => $overdueCount,
            'on_time_tasks' => $onTimeCount,
            'late_tasks' => $lateCompletedCount,
            'completion_rate' => $completionRate,
            'planned_story_points' => $plannedSp,
            'completed_story_points' => $completedSp,
            'sp_completion_rate' => $spCompletionRate,
            'priority_distribution' => $priorityCounts,
            'difficulty_distribution' => $difficultyCounts,
            'audit_tasks' => $auditTasks,
            'employee_performance' => $employeePerformance,
            'sprints_breakdown' => $sprintsBreakdown,
            'generated_at' => now()->format('M d, Y g:i A'),
        ];
    }
}
