<?php

namespace App\Services;

namespace App\Http\Controllers;

use App\Mail\ReportSharedMail;
use App\Models\Studio;
use App\Models\Tenant\ChannelMessage;
use App\Models\Tenant\Project;
use App\Models\Tenant\Report;
use App\Models\User;
use App\Services\ReportDataService;
use App\Services\ReportPdfGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantReportController extends Controller
{
    public function __construct(
        protected ReportDataService $reportDataService
    ) {}

    /**
     * Display the WorkSync Report Center & Archive.
     */
    public function index(Request $request): Response
    {
        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $studio = Studio::find($tenantId);
        $user = $request->user();

        $isLeader = $this->reportDataService->isLeaderOrManager($user, $tenantId);
        $authorizedProjectIds = $this->reportDataService->getAuthorizedProjectIds($user, $tenantId);

        // Fetch authorized projects
        $projects = Project::whereIn('id', $authorizedProjectIds)
            ->with(['sprints' => fn ($q) => $q->orderBy('start_date', 'asc')])
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'status', 'start_date', 'target_end_date']);

        // Team members: Leaders get full team; members only get their own entry
        $teamMembers = [];
        if ($studio) {
            try {
                if ($isLeader) {
                    $teamMembers = $studio->users()->orderBy('name')->get()->map(fn (User $u) => [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'role' => $u->role ?? 'Member',
                    ])->all();
                } else {
                    $teamMembers = [[
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ?? 'Member',
                    ]];
                }
            } catch (\Throwable $e) {
                // Ignore fallback
            }
        }

        // Available report types tailored to role
        $availableReportTypes = $this->reportDataService->getAvailableReportTypes($user, $tenantId);

        // Fetch archived reports filtered strictly by user authorization
        $allArchivedReports = Report::latest()->get();
        $accessibleArchivedReports = $allArchivedReports
            ->filter(fn (Report $r) => $this->reportDataService->canAccessReport($user, $r, $tenantId))
            ->map(fn (Report $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'type' => $r->type,
                'project_id' => $r->project_id,
                'employee_user_id' => $r->employee_user_id,
                'target_name' => $r->target_name,
                'orientation' => $r->orientation ?? 'portrait',
                'created_by' => $r->created_by,
                'created_by_user_id' => $r->created_by_user_id,
                'created_at' => $r->created_at->toIso8601String(),
                'metrics' => $r->metrics,
            ])
            ->values()
            ->all();

        // Default initial report selection
        $initialType = $request->query('type') ?? ($isLeader ? 'project_summary' : 'my_performance');
        $initialProjectId = $request->query('project_id') ? (int) $request->query('project_id') : ($projects->first()?->id ?? null);
        $initialSprintId = $request->query('sprint_id');

        $initialReportData = null;
        if ($initialProjectId || in_array($initialType, ['my_performance', 'my_tasks', 'my_task_activity', 'my_progress_analytics', 'team_performance'], true)) {
            $initialReportData = $this->reportDataService->calculateReport(
                $initialType,
                [
                    'project_id' => $initialProjectId,
                    'sprint_id' => $initialSprintId,
                    'employee_user_id' => $user->id,
                ],
                $user,
                $tenantId
            );
        }

        return Inertia::render('Tenant/Reports/Index', [
            'studio' => [
                'id' => $studio ? $studio->id : $tenantId,
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'currentUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'isLeader' => $isLeader,
            'projects' => $projects,
            'teamMembers' => $teamMembers,
            'availableReportTypes' => $availableReportTypes,
            'archivedReports' => $accessibleArchivedReports,
            'initialType' => $initialType,
            'initialProjectId' => $initialProjectId,
            'initialSprintId' => $initialSprintId,
            'initialReportData' => $initialReportData,
        ]);
    }

    /**
     * Generate dynamic preview report data via AJAX.
     */
    public function getReportData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|string',
            'scope' => 'nullable|string|in:sprint,project,team,schedule',
            'project_id' => 'nullable|integer',
            'sprint_id' => 'nullable',
            'sprint_ids' => 'nullable|array',
            'employee_user_id' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'orientation' => 'nullable|string|in:portrait,landscape',
        ]);

        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $user = $request->user();

        $type = $validated['type'] ?? ($validated['scope'] === 'project' ? 'project_summary' : 'sprint_performance');
        $projectId = ! empty($validated['project_id']) ? (int) $validated['project_id'] : null;
        $employeeUserId = ! empty($validated['employee_user_id']) ? (int) $validated['employee_user_id'] : null;

        // Strict permission check
        if (! $this->reportDataService->canGenerateReportType($user, $type, $projectId, $employeeUserId, $tenantId)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to access or generate this report.',
            ], 403);
        }

        $reportData = $this->reportDataService->calculateReport(
            $type,
            $validated,
            $user,
            $tenantId
        );

        if (! $reportData) {
            return response()->json([
                'success' => false,
                'message' => 'Report could not be generated. Please verify the selected filters or date range.',
            ], 404);
        }

        $reportData['orientation'] = $validated['orientation'] ?? 'portrait';

        return response()->json([
            'success' => true,
            'data' => $reportData,
        ]);
    }

    /**
     * Archive a generated report into the Report Archive.
     */
    public function archive(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'project_id' => 'nullable|integer',
            'employee_user_id' => 'nullable|integer',
            'orientation' => 'nullable|string|in:portrait,landscape',
            'metrics' => 'required|array',
        ]);

        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $user = $request->user();

        $projectId = ! empty($validated['project_id']) ? (int) $validated['project_id'] : null;
        $employeeUserId = ! empty($validated['employee_user_id']) ? (int) $validated['employee_user_id'] : null;

        // Authorization check
        if (! $this->reportDataService->canGenerateReportType($user, $validated['type'], $projectId, $employeeUserId, $tenantId)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized report archive request.',
            ], 403);
        }

        $metrics = $validated['metrics'];
        $metrics['orientation'] = $validated['orientation'] ?? 'portrait';
        $targetName = $metrics['title'] ?? ($metrics['project_name'] ?? ($metrics['employee']['name'] ?? $validated['name']));

        $report = Report::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'project_id' => $projectId,
            'employee_user_id' => $employeeUserId,
            'target_name' => $targetName,
            'orientation' => $validated['orientation'] ?? 'portrait',
            'created_by' => $user->name,
            'created_by_user_id' => $user->id,
            'metrics' => $metrics,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Report saved to Report Archive successfully.',
                'report' => [
                    'id' => $report->id,
                    'name' => $report->name,
                    'type' => $report->type,
                    'project_id' => $report->project_id,
                    'employee_user_id' => $report->employee_user_id,
                    'target_name' => $report->target_name,
                    'orientation' => $report->orientation,
                    'created_by' => $report->created_by,
                    'created_by_user_id' => $report->created_by_user_id,
                    'created_at' => $report->created_at->toIso8601String(),
                    'metrics' => $report->metrics,
                ],
            ]);
        }

        return redirect()->back()->with('success', 'Report archived successfully.');
    }

    /**
     * Delete an archived report.
     */
    public function deleteReport(Request $request, $report = null, $extra = null)
    {
        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $user = $request->user();

        $targetReportId = $extra ?? $report ?? $request->route('report') ?? $request->route('reportId');
        $report = Report::findOrFail($targetReportId);

        // Authorization: Creator or Leader/Manager can delete
        $isLeader = $this->reportDataService->isLeaderOrManager($user, $tenantId);
        if (! $isLeader && $report->created_by_user_id !== (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this archived report.',
            ], 403);
        }

        $report->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Archived report deleted successfully.',
            ]);
        }

        return redirect()->back()->with('success', 'Report deleted successfully.');
    }

    /**
     * Download report as PDF (server-generated).
     */
    public function downloadPdf(Request $request): StreamedResponse|JsonResponse
    {
        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $studio = Studio::find($tenantId);
        $studioName = $studio?->name ?? 'WorkSync Studio';
        $user = $request->user();

        $reportData = null;
        $orientation = $request->query('orientation', 'portrait');

        if ($request->has('archived_id')) {
            $report = Report::findOrFail($request->query('archived_id'));
            if (! $this->reportDataService->canAccessReport($user, $report, $tenantId)) {
                return response()->json(['message' => 'Unauthorized access to archived report.'], 403);
            }
            $reportData = $report->metrics;
            $orientation = $report->orientation ?: $orientation;
        } else {
            $type = $request->query('type', 'project_summary');
            $reportData = $this->reportDataService->calculateReport(
                $type,
                $request->all(),
                $user,
                $tenantId
            );
        }

        if (! $reportData) {
            return response()->json(['message' => 'Report not found or unavailable.'], 404);
        }

        $reportData['orientation'] = $orientation;
        $pdfContent = ReportPdfGenerator::generate($reportData, $studioName, $user->name, $orientation);
        $filename = Str::slug(($reportData['title'] ?? 'report').'-'.now()->format('Y-m-d')).'.pdf';

        return response()->streamDownload(function () use ($pdfContent) {
            echo $pdfContent;
        }, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * Share report directly via email (with PDF & CSV attachments).
     */
    public function shareEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'recipient_email' => 'required|email',
            'type' => 'nullable|string',
            'project_id' => 'nullable|integer',
            'archived_report_id' => 'nullable|integer',
            'orientation' => 'nullable|string|in:portrait,landscape',
            'personal_note' => 'nullable|string|max:1000',
            'pdf_base64' => 'nullable|string',
            'metrics' => 'nullable|array',
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
        $studioName = $studio?->name ?? 'WorkSync Studio';

        $reportData = null;
        $orientation = $validated['orientation'] ?? 'portrait';

        if (! empty($validated['archived_report_id'])) {
            $archived = Report::find($validated['archived_report_id']);
            if (! $archived || ! $this->reportDataService->canAccessReport($user, $archived, $tenantId)) {
                return response()->json(['message' => 'Archived report unavailable or access restricted.'], 403);
            }
            $reportData = $archived->metrics ?? [];
            $orientation = $archived->orientation ?? $orientation;
        } elseif (! empty($validated['metrics'])) {
            $reportData = $validated['metrics'];
        } else {
            $reportData = $this->reportDataService->calculateReport(
                $validated['type'] ?? 'project_summary',
                $validated,
                $user,
                $tenantId
            );
        }

        if (! $reportData) {
            return response()->json(['message' => 'Report could not be prepared for sharing.'], 404);
        }

        $reportTitle = $reportData['title'] ?? 'Performance Report';
        $reportData['orientation'] = $orientation;
        $cleanSlug = Str::slug($reportTitle).'-'.now()->format('Y-m-d');
        $pdfFilename = "{$cleanSlug}.pdf";
        $csvFilename = "{$cleanSlug}.csv";

        $csvContent = $this->generateCsvString($reportData);

        // Use client-rendered base64 PDF if provided, else fallback to PHP generator
        $pdfContent = null;
        if (! empty($validated['pdf_base64'])) {
            $rawB64 = preg_replace('#^data:application/pdf;base64,#i', '', $validated['pdf_base64']);
            $decoded = base64_decode($rawB64, true);
            if ($decoded !== false && strlen($decoded) > 100) {
                $pdfContent = $decoded;
            }
        }
        if (! $pdfContent) {
            $pdfContent = ReportPdfGenerator::generate($reportData, $studioName, $user->name, $orientation);
        }

        $reportUrl = url("/studio/{$tenantId}/reports");

        try {
            Mail::to($validated['recipient_email'])->send(
                new ReportSharedMail(
                    senderName: $user->name,
                    reportTitle: $reportTitle,
                    scopeType: $reportData['type'] ?? 'report',
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
                'message' => "Report delivered with PDF and CSV attachments to {$validated['recipient_email']}.",
            ]);
        } catch (\Throwable $e) {
            \Log::error('Report email failed: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to send email right now. Please verify the recipient address or try again in a few moments.',
            ], 500);
        }
    }

    /**
     * Share report into in-system private message or channel.
     */
    public function shareChat(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'recipient_type' => 'required|string|in:dm,channel',
            'recipient_id' => 'required|string',
            'report_title' => 'nullable|string',
            'project_id' => 'nullable|integer',
            'sprint_id' => 'nullable',
            'scope' => 'nullable|string|in:sprint,project',
            'type' => 'nullable|string',
            'metrics' => 'nullable|array',
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

        $metrics = $validated['metrics'] ?? [];
        if (empty($metrics) && ! empty($validated['project_id'])) {
            $type = $validated['type'] ?? ((($validated['scope'] ?? '') === 'project') ? 'project_summary' : 'sprint_performance');
            $metrics = $this->reportDataService->calculateReport($type, $validated, $user, $tenantId) ?? [];
        }

        $reportTitle = $validated['report_title'] ?? ($metrics['title'] ?? 'Performance Report');
        $body = "📊 Shared a Report: {$reportTitle}";
        if (! empty($validated['personal_note'])) {
            $body .= "\nNote: ".trim($validated['personal_note']);
        }

        $attachment = [
            'type' => 'report',
            'name' => "{$reportTitle}.pdf",
            'report_title' => $reportTitle,
            'scope' => $metrics['scope'] ?? ($metrics['type'] ?? 'report'),
            'project_name' => $metrics['project_name'] ?? 'Project',
            'completion_rate' => $metrics['completion_rate'] ?? 0,
            'total_tasks' => $metrics['total_tasks'] ?? 0,
            'completed_tasks' => $metrics['completed_tasks'] ?? 0,
            'completed_story_points' => $metrics['completed_story_points'] ?? 0,
            'report_url' => "/studio/{$tenantId}/reports",
        ];

        $role = $this->reportDataService->isLeaderOrManager($user, $tenantId) ? 'Leader' : 'Member';

        $message = ChannelMessage::create([
            'channel_id' => $channelId,
            'user_id' => $user->id,
            'sender_name' => $user->name,
            'sender_role' => $role,
            'body' => $body,
            'attachments' => [$attachment],
            'mentions' => $mentions,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report shared successfully in WorkSync chat.',
            'channel_message' => $message,
        ], 201);
    }

    /**
     * Export report data as clean CSV.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $tenantId = tenant('id') ?? (string) $request->route('tenant');
        $user = $request->user();

        $report = null;
        if ($request->has('archived_id')) {
            $r = Report::findOrFail($request->query('archived_id'));
            $report = $r->metrics;
        } else {
            $type = $request->query('type', 'project_summary');
            $report = $this->reportDataService->calculateReport($type, $request->all(), $user, $tenantId);
        }

        $report = $report ?? ['title' => 'Report', 'total_tasks' => 0];
        $filename = Str::slug(($report['title'] ?? 'report').'-'.now()->format('Y-m-d')).'.csv';
        $csvContent = $this->generateCsvString($report);

        return response()->streamDownload(function () use ($csvContent) {
            echo $csvContent;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
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
        fputcsv($handle, ['WORKSYNC - '.strtoupper($report['type'] ?? 'PERFORMANCE').' REPORT']);
        fputcsv($handle, ['Report Title', $report['title'] ?? '']);
        fputcsv($handle, ['Reporting Period', $report['reporting_period'] ?? '']);
        fputcsv($handle, ['Generated At', now()->toDateTimeString()]);
        fputcsv($handle, []);

        // Overall KPIs
        fputcsv($handle, ['KEY PERFORMANCE INDICATORS']);
        fputcsv($handle, ['Total Tasks', $report['total_tasks'] ?? 0]);
        fputcsv($handle, ['Completed Tasks', $report['completed_tasks'] ?? 0]);
        fputcsv($handle, ['Completion Rate', ($report['completion_rate'] ?? 0).'%']);
        fputcsv($handle, ['Planned Story Points', $report['planned_story_points'] ?? 0]);
        fputcsv($handle, ['Completed Story Points', $report['completed_story_points'] ?? 0]);
        fputcsv($handle, []);

        // Audit Table
        $audit = $report['audit_tasks'] ?? [];
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
                'Original SP',
                'Final SP',
                'SP Difference',
                'Priority',
                'Difficulty',
            ]);

            foreach ($audit as $task) {
                fputcsv($handle, [
                    $task['id'] ?? '—',
                    $task['title'] ?? '—',
                    $task['assigned_employee'] ?? 'Unassigned',
                    $task['completed_by_employee'] ?? '—',
                    $task['status'] ?? '—',
                    $task['assigned_date'] ?? '—',
                    $task['deadline'] ?? '—',
                    $task['completed_date'] ?? '—',
                    $task['on_time_status'] ?? '—',
                    $task['original_sp'] ?? 0,
                    $task['final_sp'] ?? 0,
                    $task['sp_difference'] ?? 0,
                    $task['priority'] ?? 'Medium',
                    $task['difficulty'] ?? 'Medium',
                ]);
            }
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv ?: '';
    }

    /**
     * Backward-compatible helper for legacy callers.
     *
     * @return array<string, mixed>|null
     */
    public function calculateReportMetrics(int $projectId, ?int $sprintId = null, string $scope = 'sprint'): ?array
    {
        $user = auth()->user() ?? User::first();
        $type = $scope === 'sprint' ? 'sprint_performance' : 'project_summary';

        return $this->reportDataService->calculateReport($type, [
            'project_id' => $projectId,
            'sprint_id' => $sprintId,
        ], $user);
    }
}
