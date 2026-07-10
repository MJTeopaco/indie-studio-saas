<?php

namespace App\Policies;

use App\Models\Tenant\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProjectPolicy
{
    /**
     * Determine if the user is a Studio Owner or global Admin.
     */
    protected function isStudioOwnerOrAdmin(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return DB::table('studio_members')
            ->where('user_id', $user->id)
            ->where('role', 'owner')
            ->exists();
    }

    /**
     * Determine whether the user can view the specific project.
     * Specific members can only view projects assigned to them (or studio owners).
     */
    public function view(User $user, Project $project): bool
    {
        if ($this->isStudioOwnerOrAdmin($user)) {
            return true;
        }

        return $project->hasMember($user->id);
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
