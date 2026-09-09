<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sprint extends Model
{
    use HasFactory;

    protected $table = 'sprints';

    protected $fillable = [
        'project_id',
        'name',
        'goal',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /**
     * Get the project that owns the sprint.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Get the tasks assigned to this sprint.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'sprint_id');
    }

    /**
     * Get the velocity records for this sprint.
     */
    public function velocity(): HasMany
    {
        return $this->hasMany(TeamVelocity::class, 'sprint_id');
    }
}
