<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $table = 'projects';

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::created(function ($project) {
            $project->epicGroups()->create([
                'name' => 'Epics Backlog',
                'goal' => 'Uncommitted epics pending roadmap assignment',
                'is_default' => true,
                'display_order' => 999999, // Rendered last, but is_default forces it to end anyway
            ]);
        });
    }

    protected $fillable = [
        'name',
        'description',
        'status',
        'start_date',
        'target_end_date',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'target_end_date' => 'date',
        ];
    }

    /**
     * Get the project member pivot records for this project.
     */
    public function projectMembers(): HasMany
    {
        return $this->hasMany(ProjectMember::class, 'project_id');
    }

    /**
     * Get the central users assigned as members of this project.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members', 'project_id', 'user_id')
                    ->withPivot('project_role')
                    ->withTimestamps();
    }

    /**
     * Get the tasks belonging to this project.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'project_id');
    }

    /**
     * Get the epics belonging to this project.
     */
    public function epics(): HasMany
    {
        return $this->hasMany(Epic::class, 'project_id');
    }

    /**
     * Get the sprints belonging to this project.
     */
    public function sprints(): HasMany
    {
        return $this->hasMany(Sprint::class, 'project_id');
    }

    /**
     * Determine if a given central user ID is assigned as a member of this project.
     */
    public function hasMember(int $userId): bool
    {
        return $this->projectMembers()->where('user_id', $userId)->exists();
    }

    /**
     * Get the epic groups belonging to this project.
     */
    public function epicGroups(): HasMany
    {
        return $this->hasMany(EpicGroup::class, 'project_id');
    }
}
