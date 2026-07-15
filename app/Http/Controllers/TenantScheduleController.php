<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TenantScheduleController extends Controller
{
    public function index(Request $request, ?string $tenant = null)
    {
        $studio = Studio::find(tenant('id'));

        $user = auth()->user();
        $isManager = false;
        if ($user && $user->role === \App\Models\User::ROLE_ADMIN) {
            $isManager = true;
        } else {
            $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
                ->where('studio_id', tenant('id'))
                ->where('user_id', $user->id)
                ->first();
            $role = $member ? $member->role : 'member';
            $isManager = in_array($role, ['owner', 'leader', 'manager']);
        }

        $latestAssignments = DB::table('assignments')
            ->select('task_id', DB::raw('MAX(assigned_at) as assigned_at'))
            ->groupBy('task_id');

        $query = Task::with(['assignee', 'predecessors', 'project'])
            ->leftJoinSub($latestAssignments, 'latest_assignments', function ($join) {
                $join->on('tasks.id', '=', 'latest_assignments.task_id');
            })
            ->select('tasks.*', 'latest_assignments.assigned_at as assignment_assigned_at')
            ->orderBy('es')
            ->orderBy('tasks.id');

        if (!$isManager) {
            $query->where('assigned_user_id', $user->id);
        }

        if ($request->filled('project_id') && $request->project_id !== 'all') {
            $query->where('project_id', $request->project_id);
        }

        $tasks = $query->get()->map(function (Task $t): array {
            return [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'status' => $t->status,
                'priority' => $t->priority,
                'estimated_hours' => (float) $t->estimated_hours,
                'days_until_deadline' => $t->days_until_deadline,
                'hard_constraint_date' => $t->hard_constraint_date?->format('Y-m-d'),
                'project_id' => $t->project_id,
                'project_name' => $t->project?->name,
                'project' => $t->project ? [
                    'id' => $t->project->id,
                    'name' => $t->project->name,
                    'start_date' => $t->project->start_date?->format('Y-m-d'),
                ] : null,
                'assigned_user_id' => $t->assigned_user_id,
                'assigned_at' => $t->assignment_assigned_at
                    ? \Carbon\Carbon::parse($t->assignment_assigned_at)->toIso8601String()
                    : ($t->created_at ? $t->created_at->toIso8601String() : null),
                'dueDate' => $t->days_until_deadline !== null
                    ? ($t->project?->start_date ? $t->project->start_date->addDays($t->days_until_deadline)->format('Y-m-d') : now()->addDays($t->days_until_deadline)->format('Y-m-d'))
                    : null,
                'assignee' => $t->assignee ? [
                    'id' => $t->assignee->id,
                    'name' => $t->assignee->name,
                    'email' => $t->assignee->email,
                ] : null,
                'depends_on' => $t->predecessors->pluck('id')->all(),
                'es' => $t->es !== null ? (float) $t->es : null,
                'ef' => $t->ef !== null ? (float) $t->ef : null,
                'ls' => $t->ls !== null ? (float) $t->ls : null,
                'lf' => $t->lf !== null ? (float) $t->lf : null,
                'total_float' => $t->total_float !== null ? (float) $t->total_float : null,
                'is_critical' => (bool) $t->is_critical,
                'schedule_computed_at' => $t->schedule_computed_at?->toIso8601String(),
            ];
        });

        $projects = Project::orderBy('name')->get()->map(function (Project $p): array {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'start_date' => $p->start_date?->format('Y-m-d'),
                'target_end_date' => $p->target_end_date?->format('Y-m-d'),
            ];
        });

        return Inertia::render('Tenant/Schedule/Index', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Studio',
            ],
            'tasks' => $tasks,
            'projects' => $projects,
            'filters' => [
                'project_id' => $request->input('project_id', 'all'),
            ],
        ]);
    }
}
