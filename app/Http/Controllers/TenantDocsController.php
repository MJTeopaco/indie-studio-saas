<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\Tenant\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantDocsController extends Controller
{
    /**
     * Display documentation and reports list.
     */
    public function index()
    {
        $studio = Studio::find(tenant('id'));
        
        $projects = Project::orderBy('name')->get()->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
        ])->all();

        // Get members
        $members = [];
        if ($studio) {
            $members = $studio->users()->orderBy('name')->get()->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])->all();
        }

        // Get existing reports
        $reports = Report::latest()->get()->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'type' => $r->type,
            'target_name' => $r->target_name,
            'created_by' => $r->created_by,
            'created_at' => $r->created_at->toIso8601String(),
            'metrics' => $r->metrics,
        ])->all();

        return Inertia::render('Tenant/Docs', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'projects' => $projects,
            'members' => $members,
            'reports' => $reports,
        ]);
    }

    /**
     * Generate and archive a report.
     */
    public function archive(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:project,team,schedule',
            'target_id' => 'nullable|string', // project_id or user_id
            'date_range' => 'nullable|array',
            'date_range.start' => 'nullable|date',
            'date_range.end' => 'nullable|date',
        ]);

        $targetName = 'All Workspace';
        $metrics = [];

        if ($validated['type'] === 'project' && $validated['target_id']) {
            $proj = Project::find($validated['target_id']);
            if ($proj) {
                $targetName = $proj->name;
                $tasks = Task::where('project_id', $proj->id)->with('assignee')->get();
                $total = $tasks->count();
                $done = $tasks->where('status', 'completed')->count();

                $logs = [];
                $taskIds = $tasks->pluck('id')->all();
                $assignments = \DB::table('assignments')->whereIn('task_id', $taskIds)->get();
                foreach ($tasks as $t) {
                    $createdTime = $t->created_at ? $t->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                    $logs[] = [
                        'timestamp' => $createdTime,
                        'message' => "Task #{$t->id} ('{$t->title}') initialized with '" . ($t->priority ?? 'medium') . "' priority.",
                        'type' => 'info'
                    ];

                    $tAssigns = $assignments->where('task_id', $t->id);
                    foreach ($tAssigns as $assign) {
                        $assigneeName = $t->assignee ? $t->assignee->name : 'Developer';
                        $assignTime = \Carbon\Carbon::parse($assign->assigned_at)->format('Y-m-d H:i:s');
                        $fitScoreText = $assign->match_fit_score ? number_format((float) $assign->match_fit_score * 100, 1) . "%" : 'N/A';
                        $logs[] = [
                            'timestamp' => $assignTime,
                            'message' => "Task #{$t->id} assigned to {$assigneeName} via " . ($assign->assigned_by ?? 'manual') . " (Match Fit: {$fitScoreText}).",
                            'type' => 'success'
                        ];
                    }

                    if ($t->status === 'completed') {
                        $completedTime = $t->updated_at ? $t->updated_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                        $logs[] = [
                            'timestamp' => $completedTime,
                            'message' => "Task #{$t->id} ('{$t->title}') moved to 'completed'.",
                            'type' => 'success'
                        ];
                    } elseif ($t->status === 'review') {
                        $reviewTime = $t->updated_at ? $t->updated_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                        $logs[] = [
                            'timestamp' => $reviewTime,
                            'message' => "Task #{$t->id} ('{$t->title}') submitted for review.",
                            'type' => 'warning'
                        ];
                    }
                }
                usort($logs, fn($a, $b) => strcmp($a['timestamp'], $b['timestamp']));

                $metrics = [
                    'total_tasks' => $total,
                    'completed_tasks' => $done,
                    'completion_rate' => $total ? round(($done / $total) * 100) : 0,
                    'critical_tasks' => $tasks->filter(fn ($t) => $t->is_critical || $t->total_float === 0)->count(),
                    'tasks_list' => $tasks->map(fn ($t) => [
                        'id' => $t->id,
                        'title' => $t->title,
                        'status' => $t->status,
                        'priority' => $t->priority,
                        'estimated_hours' => $t->estimated_hours,
                        'assignee' => $t->assignee ? $t->assignee->name : 'Unassigned',
                        'is_critical' => $t->is_critical || $t->total_float === 0,
                    ])->all(),
                    'logs' => array_slice($logs, 0, 50), // Cap logs at 50 for database size bounds
                ];
            }
        } elseif ($validated['type'] === 'team' && $validated['target_id']) {
            // Find user inside central system or studio members
            $user = \App\Models\User::find($validated['target_id']);
            if ($user) {
                $targetName = $user->name;
                $tasks = Task::where('assigned_user_id', $user->id)->with('assignee')->get();
                $total = $tasks->count();
                $done = $tasks->where('status', 'completed')->count();

                $logs = [];
                $taskIds = $tasks->pluck('id')->all();
                $assignments = \DB::table('assignments')->whereIn('task_id', $taskIds)->where('employee_user_id', $user->id)->get();
                foreach ($tasks as $t) {
                    $createdTime = $t->created_at ? $t->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                    $logs[] = [
                        'timestamp' => $createdTime,
                        'message' => "Task #{$t->id} assigned to {$user->name} was initialized.",
                        'type' => 'info'
                    ];

                    $tAssigns = $assignments->where('task_id', $t->id);
                    foreach ($tAssigns as $assign) {
                        $assignTime = \Carbon\Carbon::parse($assign->assigned_at)->format('Y-m-d H:i:s');
                        $fitScoreText = $assign->match_fit_score ? number_format((float) $assign->match_fit_score * 100, 1) . "%" : 'N/A';
                        $logs[] = [
                            'timestamp' => $assignTime,
                            'message' => "Assignment confirmed via " . ($assign->assigned_by ?? 'manual') . " (Match Fit: {$fitScoreText}).",
                            'type' => 'success'
                        ];
                    }

                    if ($t->status === 'completed') {
                        $completedTime = $t->updated_at ? $t->updated_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                        $logs[] = [
                            'timestamp' => $completedTime,
                            'message' => "Task #{$t->id} ('{$t->title}') marked completed by {$user->name}.",
                            'type' => 'success'
                        ];
                    }
                }
                usort($logs, fn($a, $b) => strcmp($a['timestamp'], $b['timestamp']));

                $metrics = [
                    'total_tasks' => $total,
                    'completed_tasks' => $done,
                    'completion_rate' => $total ? round(($done / $total) * 100) : 0,
                    'tasks_list' => $tasks->map(fn ($t) => [
                        'id' => $t->id,
                        'title' => $t->title,
                        'status' => $t->status,
                        'priority' => $t->priority,
                        'estimated_hours' => $t->estimated_hours,
                        'assignee' => $t->assignee ? $t->assignee->name : 'Unassigned',
                        'is_critical' => $t->is_critical || $t->total_float === 0,
                    ])->all(),
                    'logs' => array_slice($logs, 0, 50),
                ];
            }
        } elseif ($validated['type'] === 'schedule') {
            $start = $validated['date_range']['start'] ?? now()->startOfMonth()->toDateString();
            $end = $validated['date_range']['end'] ?? now()->endOfMonth()->toDateString();
            $targetName = "{$start} to {$end}";
            // Find tasks or assignments in this range
            $tasks = Task::where(function ($q) use ($start, $end) {
                $q->whereBetween('hard_constraint_date', [$start, $end])
                  ->orWhereNull('hard_constraint_date');
            })->with('assignee')->get();
            $total = $tasks->count();
            $done = $tasks->where('status', 'completed')->count();

            $logs = [];
            foreach ($tasks as $t) {
                $assigneeName = $t->assignee ? $t->assignee->name : 'Unassigned';
                $createdTime = $t->created_at ? $t->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                $logs[] = [
                    'timestamp' => $createdTime,
                    'message' => "Task #{$t->id} ('{$t->title}') scheduled. Assignee: {$assigneeName}.",
                    'type' => 'info'
                ];

                if ($t->hard_constraint_date) {
                    $constraintTime = $t->updated_at ? $t->updated_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                    $logs[] = [
                        'timestamp' => $constraintTime,
                        'message' => "Hard constraint date set to " . $t->hard_constraint_date->toDateString() . ".",
                        'type' => 'warning'
                    ];
                }
            }
            usort($logs, fn($a, $b) => strcmp($a['timestamp'], $b['timestamp']));

            $metrics = [
                'total_tasks' => $total,
                'completed_tasks' => $done,
                'completion_rate' => $total ? round(($done / $total) * 100) : 0,
                'start_date' => $start,
                'end_date' => $end,
                'tasks_list' => $tasks->map(fn ($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'status' => $t->status,
                    'priority' => $t->priority,
                    'estimated_hours' => $t->estimated_hours,
                    'assignee' => $t->assignee ? $t->assignee->name : 'Unassigned',
                    'is_critical' => $t->is_critical || $t->total_float === 0,
                ])->all(),
                'logs' => array_slice($logs, 0, 50),
            ];
        }

        Report::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'target_name' => $targetName,
            'created_by' => auth()->user()->name,
            'metrics' => $metrics,
        ]);

        return redirect()->back()->with('success', 'Report generated and archived successfully.');
    }

    /**
     * Delete an archived report.
     */
    public function deleteReport($tenant, $report)
    {
        $rep = Report::findOrFail($report);
        $rep->delete();
        
        return redirect()->back()->with('success', 'Report deleted successfully.');
    }
}
