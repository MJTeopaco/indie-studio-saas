<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantTaskController extends Controller
{
    public function index(Request $request)
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
        
        $projects = Project::latest()->get()->map(fn (Project $project) => [
            'id' => $project->id,
            'name' => $project->name,
            'status' => $project->status,
        ])->all();

        $tasks = [];
        foreach ($projects as $project) {
            $query = Task::with('assignee')
                ->where('project_id', $project['id']);

            if (!$isManager) {
                $query->where('assigned_user_id', $user->id);
            }

            $tasks[$project['id']] = $query->get()
                ->map(fn (Task $task) => [
                    'id' => $task->id,
                    'project_id' => $task->project_id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'task_classification' => $task->task_classification,
                    'required_position' => $task->required_position,
                    'task_difficulty' => $task->task_difficulty,
                    'priority' => $task->priority,
                    'estimated_hours' => $task->estimated_hours,
                    'days_until_deadline' => $task->days_until_deadline,
                    'status' => $task->status,
                    'assignee' => $task->assignee ? $task->assignee->name : null,
                    'assigned_user_id' => $task->assigned_user_id,
                    'dueDate' => $task->days_until_deadline !== null ? now()->addDays($task->days_until_deadline)->toDateString() : null,
                    'startDate' => now()->toDateString(),
                ])->all();
        }

        return Inertia::render('Tenant/Tasks/Index', [
            'studio' => [
                'id' => $studio ? $studio->id : tenant('id'),
                'name' => $studio ? $studio->name : 'Pixel Play Studio',
            ],
            'projects' => $projects,
            'tasks' => $tasks,
        ]);
    }
}
