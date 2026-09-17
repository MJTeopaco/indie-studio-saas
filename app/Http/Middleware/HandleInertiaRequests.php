<?php

namespace App\Http\Middleware;

use App\Models\Tenant\ChannelMessage;
use App\Models\Tenant\ChannelRead;
use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use App\Models\Tenant\TaskEstimateSubmission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // Provides the active studio UUID to all React pages.
            // null on central pages; UUID string on /studio/{tenant}/... pages.
            'activeWorkspace' => tenant('id'),

            // Share current workspace role and manage permission status
            'currentUserRole' => function () use ($request) {
                if (! tenant() || ! $request->user()) {
                    return null;
                }
                $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
                    ->where('studio_id', tenant('id'))
                    ->where('user_id', $request->user()->id)
                    ->first();

                return $member ? $member->role : 'member';
            },
            'canManage' => function () use ($request) {
                if (! tenant() || ! $request->user()) {
                    return false;
                }
                if ($request->user()->role === User::ROLE_ADMIN) {
                    return true;
                }
                $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
                    ->where('studio_id', tenant('id'))
                    ->where('user_id', $request->user()->id)
                    ->first();
                $role = $member ? $member->role : 'member';

                return in_array($role, ['owner', 'leader', 'manager']);
            },

            // Share the list of projects for the current workspace
            'workspaceProjects' => function () {
                if (! tenant()) {
                    return [];
                }
                try {
                    return Project::select('id', 'name', 'status')->latest()->get()->toArray();
                } catch (\Exception $e) {
                    return [];
                }
            },

            // Share pending estimates count for the current user
            'pendingEstimatesCount' => function () use ($request) {
                if (! tenant() || ! $request->user()) {
                    return 0;
                }
                try {
                    $user = $request->user();

                    return Task::where('story_points_locked', false)
                        ->where('needs_estimate_review', false)
                        ->get()
                        ->filter(function ($task) use ($user) {
                            if (empty($task->expected_estimators)) {
                                return $task->assigned_user_id === $user->id;
                            }

                            return in_array($user->id, $task->expected_estimators);
                        })
                        ->filter(function ($task) use ($user) {
                            return ! TaskEstimateSubmission::where('task_id', $task->id)
                                ->where('developer_id', $user->id)
                                ->exists();
                        })
                        ->count();
                } catch (\Exception $e) {
                    return 0;
                }
            },

            // Share total inbox/notification count (reviews pending + unstarted tasks)
            'inboxNotificationCount' => function () use ($request) {
                if (! tenant() || ! $request->user()) {
                    return 0;
                }
                try {
                    $user = $request->user();
                    $reviewTasksCount = Task::where('reviewer_user_id', $user->id)
                        ->where(function ($q) {
                            $q->where('status', 'review')
                                ->orWhere('sprint_status', 'waiting_for_review');
                        })
                        ->count();

                    $unstartedTasksCount = Task::where('assigned_user_id', $user->id)
                        ->where(function ($q) {
                            $q->where('status', 'todo')
                                ->orWhere('sprint_status', 'ready_to_start');
                        })
                        ->count();

                    $messageNotifCount = 0;
                    if (Schema::hasTable('channel_messages')) {
                        $userReads = collect();
                        if (Schema::hasTable('channel_reads')) {
                            $userReads = ChannelRead::where('user_id', $user->id)->get()->keyBy('channel_id');
                        }

                        $messages = ChannelMessage::where('user_id', '!=', $user->id)
                            ->where('is_unsent', false)
                            ->where(function ($q) use ($user) {
                                $q->where(function ($sq) use ($user) {
                                    $sq->where('channel_id', 'like', "dm-{$user->id}_%")
                                        ->orWhere('channel_id', 'like', "dm-%_{$user->id}")
                                        ->orWhere('channel_id', 'like', "dm-{$user->id}-%")
                                        ->orWhere('channel_id', 'like', "dm-%-{$user->id}");
                                })->orWhere('channel_id', 'not like', 'dm-%');
                            })
                            ->where('created_at', '>=', now()->subDays(5))
                            ->get();

                        $messageNotifCount = $messages->filter(function ($msg) use ($userReads) {
                            $userRead = $userReads->get($msg->channel_id);
                            if (! $userRead) {
                                return true;
                            }
                            if ($userRead->last_read_message_id && $msg->id <= $userRead->last_read_message_id) {
                                return false;
                            }
                            if ($userRead->last_read_at && $msg->created_at <= $userRead->last_read_at) {
                                return false;
                            }

                            return true;
                        })->count();
                    }

                    return $reviewTasksCount + $unstartedTasksCount + $messageNotifCount;
                } catch (\Exception $e) {
                    return 0;
                }
            },
        ];
    }
}
