<?php

namespace App\Policies;

use App\Models\Tenant\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProjectPolicy
{
    /**
     * Determine if the user is a Studio Owner, Manager, Leader or global Admin.
     */
    protected function isStudioOwnerOrAdmin(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $studioId = tenant('id');

        $query = DB::table('studio_members')
            ->where('user_id', $user->id)
            ->whereIn('role', ['owner', 'leader', 'manager']);

        if ($studioId) {
            $query->where('studio_id', $studioId);
        }

        return $query->exists();
    }

    /**
     * Determine whether the user can view the specific project.
     * Specific members can only view projects assigned to them (or studio managers/leaders).
     */
    public function view(User $user, Project $project): bool
    {
        if ($this->isStudioOwnerOrAdmin($user)) {
            return true;
        }

        if ($project->hasMember($user->id)) {
            return true;
        }

        return $project->tasks()->where(function ($q) use ($user) {
            $q->where('assigned_user_id', $user->id)
                ->orWhere('reviewer_user_id', $user->id);
        })->exists();
    }

    /**
     * Determine whether the user can update the project.
     */
    public function update(User $user, Project $project): bool
    {
        if ($this->isStudioOwnerOrAdmin($user)) {
            return true;
        }

        return $project->projectMembers()
            ->where('user_id', $user->id)
            ->where('project_role', 'lead')
            ->exists();
    }

    /**
     * Determine whether the user can join or access tasks within the project.
     */
    public function accessTasks(User $user, Project $project): bool
    {
        if ($this->isStudioOwnerOrAdmin($user)) {
            return true;
        }

        return $project->hasMember($user->id);
    }
}
