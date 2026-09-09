<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Epic extends Model
{
    use HasFactory;

    protected $table = 'epics';

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'color',
        'phase_id',
        'priority_id',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::deleting(function ($epic) {
            if ($epic->tasks()->exists()) {
                throw new \Exception('Cannot delete an epic that contains tasks. Please reassign or delete the tasks first.');
            }
        });
    }

    /**
     * Get the project that owns the epic.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Get the tasks belonging to this epic.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'epic_id');
    }

    /**
     * Get the phase of this epic.
     */
    public function phase(): BelongsTo
    {
        return $this->belongsTo(EpicPhase::class, 'phase_id');
    }

    /**
     * Get the priority of this epic.
     */
    public function priority(): BelongsTo
    {
        return $this->belongsTo(EpicPriority::class, 'priority_id');
    }
}
