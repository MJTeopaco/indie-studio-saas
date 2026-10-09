<?php

namespace App\Observers;

use App\Models\Tenant\ActivityLog;
use App\Models\Tenant\Task;

class TaskObserver
{
    public function created(Task $task): void
    {
        if ($task->story_points !== null) {
            $user = auth()->user();
            ActivityLog::create([
                'subject_type' => Task::class,
                'subject_id'   => $task->id,
                'field'        => 'story_points',
                'old_value'    => null,
                'new_value'    => (string) $task->story_points,
                'user_id'      => $user?->id ?? null,
                'user_name'    => $user?->name ?? 'System',
            ]);
        }
    }

    public function updated(Task $task): void
    {
        if ($task->wasChanged('story_points')) {
            $user = auth()->user();
            ActivityLog::create([
                'subject_type' => Task::class,
                'subject_id'   => $task->id,
                'field'        => 'story_points',
                'old_value'    => (string) $task->getOriginal('story_points'),
                'new_value'    => (string) $task->story_points,
                'user_id'      => $user?->id ?? null,
                'user_name'    => $user?->name ?? 'System',
            ]);
        }
    }
}
