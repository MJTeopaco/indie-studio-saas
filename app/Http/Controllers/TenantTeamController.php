<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\Tenant\Project;
use App\Models\Tenant\ProjectMember;
use App\Models\Tenant\Task;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class TenantTeamController extends Controller
{
    /**
     * Show the Team Overview for the active tenant (studio).
     */
    public function index(): Response
    {
        $studio = Studio::with(['users.globalProfile.position', 'users.globalProfile.skills'])->find(tenant('id'));
        $studioName = $studio ? $studio->name : 'Studio';

        $members = collect();
        if ($studio && $studio->users->isNotEmpty()) {
            $userIds = $studio->users->pluck('id');

            $memberProjectRows = ProjectMember::query()
                ->whereIn('user_id', $userIds)
                ->get()
                ->groupBy('user_id');

            $assignedTaskRows = Task::query()
                ->select([
                    'id',
                    'project_id',
                    'assigned_user_id',
                    'title',
                    'status',
                    'estimated_hours',
                    'created_at',
                    'updated_at',
                    'days_until_deadline',
                ])
                ->whereIn('assigned_user_id', $userIds)
                ->get();

            $assignmentTaskIdsByUser = collect();
            if (Schema::hasTable('assignments')) {
                $assignmentTaskIdsByUser = DB::table('assignments')
                    ->select('employee_user_id', 'task_id')
                    ->whereIn('employee_user_id', $userIds)
                    ->whereNotNull('task_id')
                    ->get()
                    ->groupBy('employee_user_id')
                    ->map(fn ($rows) => collect($rows)->pluck('task_id')->unique()->values());
            }

            $historicalTaskIds = $assignmentTaskIdsByUser
                ->flatten()
                ->filter()
                ->unique()
                ->values();

            $historicalTaskRows = $historicalTaskIds->isNotEmpty()
                ? Task::query()
                    ->select([
                        'id',
                        'project_id',
                        'assigned_user_id',
                        'title',
                        'status',
                        'estimated_hours',
                        'created_at',
                        'updated_at',
                        'days_until_deadline',
                    ])
                    ->whereIn('id', $historicalTaskIds)
                    ->get()
                : collect();

            $memberTaskRows = $assignedTaskRows
                ->concat($historicalTaskRows)
                ->unique('id')
                ->values();

            $projectIdsWithMembership = $memberProjectRows
                ->flatten(1)
                ->pluck('project_id')
                ->filter()
                ->unique();

            $projectIdsFromTasks = $memberTaskRows
                ->pluck('project_id')
                ->filter()
                ->unique();

            $projectLookup = Project::query()
                ->select(['id', 'name', 'status', 'target_end_date'])
                ->whereIn('id', $projectIdsWithMembership->merge($projectIdsFromTasks)->unique()->values())
                ->get()
                ->keyBy('id');

            $assignedTasksByUser = $assignedTaskRows->groupBy('assigned_user_id');

            $members = $studio->users->map(function ($user) use ($memberProjectRows, $memberTaskRows, $assignedTasksByUser, $assignmentTaskIdsByUser, $projectLookup) {
                $role = $user->pivot ? $user->pivot->role : 'member';
                $position = $user->globalProfile && $user->globalProfile->position 
                    ? $user->globalProfile->position->name 
                    : ($user->role === 'admin' ? 'Project Lead' : 'Developer');
                $maxHoursPerWeek = (int) ($user->globalProfile->max_hours_per_week ?? 40);
                $historicalTaskIds = collect($assignmentTaskIdsByUser->get($user->id, collect()));
                $historicalTasks = $historicalTaskIds->isNotEmpty()
                    ? $memberTaskRows->whereIn('id', $historicalTaskIds->all())
                    : collect();

                $assignedTasks = collect($assignedTasksByUser->get($user->id, collect()));
                $memberTasks = $assignedTasks
                    ->concat($historicalTasks)
                    ->unique('id')
                    ->values();

                $activeStatuses = ['todo', 'in_progress', 'review'];
                $activeTasks = $assignedTasks->whereIn('status', $activeStatuses);
                $reviewTasksCount = $memberTasks->where('status', 'review')->count();

                $activeLoadHours = (float) $activeTasks->sum(fn ($task) => (float) ($task->estimated_hours ?? 0));
                $utilizationRate = $maxHoursPerWeek > 0
                    ? (int) max(0, min(100, round(($activeLoadHours / $maxHoursPerWeek) * 100)))
                    : 0;
                $revisionRate = $memberTasks->isNotEmpty()
                    ? (int) round(($reviewTasksCount / $memberTasks->count()) * 100)
                    : 0;

                $avgUpdateHours = $memberTasks
                    ->map(function ($task): float {
                        return (float) $task->created_at->diffInHours($task->updated_at);
                    })
                    ->avg();
                $avgUpdateLabel = $this->formatHourDuration($avgUpdateHours);

                $availabilityDays = $maxHoursPerWeek > 0
                    ? (int) ceil(($activeLoadHours / $maxHoursPerWeek) * 7)
                    : 0;
                $nextAvailabilityDate = now()->addDays(max($availabilityDays, 0));

                $lastActiveAt = $memberTasks->max('updated_at');
                $lastUpdateSentAt = $memberTasks
                    ->whereIn('status', ['review', 'completed'])
                    ->max('updated_at');

                $membershipRows = collect($memberProjectRows->get($user->id, collect()));
                $projectRoleById = $membershipRows
                    ->pluck('project_role', 'project_id')
                    ->all();

                $projectIds = $membershipRows
                    ->pluck('project_id')
                    ->merge($memberTasks->pluck('project_id'))
                    ->filter()
                    ->unique()
                    ->values();

                $memberProjects = $projectIds
                    ->map(function ($projectId) use ($memberTasks, $projectLookup, $projectRoleById) {
                        $project = $projectLookup->get($projectId);
                        if (! $project) {
                            return null;
                        }

                        $projectTasks = $memberTasks->where('project_id', $project->id);
                        $openProjectTasks = $projectTasks->whereIn('status', ['todo', 'in_progress', 'review'])->count();
                        $completedProjectTasks = $projectTasks->where('status', 'completed')->count();
                        $isExpiring = $project->target_end_date !== null
                            && Carbon::parse($project->target_end_date)->isPast()
                            && (($openProjectTasks > 0) || $project->status !== 'completed');

                        return [
                            'id' => $project->id,
                            'name' => $project->name,
                            'status' => $project->status,
                            'project_role' => $projectRoleById[$project->id] ?? 'contributor',
                            'task_open_count' => $openProjectTasks,
                            'task_completed_count' => $completedProjectTasks,
                            'health' => $isExpiring ? 'Expiring' : 'On track',
                            'health_tone' => $isExpiring ? 'danger' : 'success',
                        ];
                    })
                    ->filter()
                    ->values();

                $skillset = $user->globalProfile && $user->globalProfile->skills
                    ? $user->globalProfile->skills
                        ->map(fn ($skill) => [
                            'id' => $skill->id,
                            'name' => $skill->name,
                            'category' => $skill->category,
                            'proficiency_level' => (int) ($skill->pivot->proficiency_level ?? 0),
                        ])
                        ->values()
                        ->all()
                    : [];

                $health = $this->deriveProfileHealth($utilizationRate, $revisionRate);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role,
                    'position' => $position,
                    'joined_at' => $user->pivot && $user->pivot->created_at 
                        ? $user->pivot->created_at->format('M d, Y') 
                        : $user->created_at->format('M d, Y'),
                    'profile' => [
                        'health' => $health,
                        'utilization_rate' => $utilizationRate,
                        'avg_update_time' => $avgUpdateLabel,
                        'revision_rate' => $revisionRate,
                        'next_availability_date' => $nextAvailabilityDate->format('F j, Y'),
                        'last_active' => $lastActiveAt
                            ? Carbon::parse($lastActiveAt)->diffForHumans()
                            : 'No activity yet',
                        'last_update_sent' => $lastUpdateSentAt
                            ? Carbon::parse($lastUpdateSentAt)->diffForHumans()
                            : 'No updates yet',
                        'skillset' => $skillset,
                        'projects' => $memberProjects->all(),
                        'stats' => [
                            'max_hours_per_week' => $maxHoursPerWeek,
                            'active_load_hours' => round($activeLoadHours, 1),
                            'total_tasks' => $memberTasks->count(),
                            'active_tasks' => $activeTasks->count(),
                            'completed_tasks' => $memberTasks->where('status', 'completed')->count(),
                        ],
                    ],
                ];
            });
        }

        // Query the logged-in user's role inside the active studio from the central database
        $currentUserMember = \DB::connection(config('tenancy.database.central_connection', 'central'))
            ->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', auth()->id())
            ->first();

        $currentUserRole = $currentUserMember ? $currentUserMember->role : 'member';

        // Set canManage true if they are owner, team leader, manager, or global platform admin
        $canManage = in_array($currentUserRole, ['owner', 'leader', 'manager'])
            || (auth()->check() && auth()->user()->role === \App\Models\User::ROLE_ADMIN);

        return Inertia::render('Tenant/Team/Index', [
            'studio' => [
                'id' => tenant('id'),
                'name' => $studioName,
            ],
            'members' => $members,
            'canManage' => $canManage,
        ]);
    }

    private function formatHourDuration(float|int|null $hours): string
    {
        if ($hours === null || $hours <= 0) {
            return '0h';
        }

        $totalHours = (int) round($hours);
        $days = intdiv($totalHours, 24);
        $remainingHours = $totalHours % 24;

        if ($days > 0) {
            return "{$days}d {$remainingHours}h";
        }

        return "{$remainingHours}h";
    }

    /**
     * @return array{label: string, tone: string}
     */
    private function deriveProfileHealth(int $utilizationRate, int $revisionRate): array
    {
        if ($utilizationRate >= 95 || $revisionRate >= 70) {
            return ['label' => 'At Risk', 'tone' => 'danger'];
        }

        if ($utilizationRate >= 80 || $revisionRate >= 45) {
            return ['label' => 'Watchlist', 'tone' => 'warning'];
        }

        return ['label' => 'Healthy', 'tone' => 'success'];
    }
}
