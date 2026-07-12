<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    use HasFactory;

    protected $table = 'tasks';

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'task_classification',
        'required_position',
        'minimum_experience_years',
        'task_difficulty',
        'priority',
        'estimated_hours',
        'days_until_deadline',
        'target_macro_domains',
        'required_skills',
        'assigned_user_id',
        'status',
        // CPA schedule fields
        'es',
        'ef',
        'ls',
        'lf',
        'total_float',
        'is_critical',
        'schedule_computed_at',
    ];

    protected function casts(): array
    {
        return [
            'target_macro_domains' => 'array',
            'required_skills' => 'array',
            'minimum_experience_years' => 'float',
            'estimated_hours' => 'float',
            'days_until_deadline' => 'integer',
        ];
    }

    /**
     * Get the project that owns the task.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Get the central user assigned to this task.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * Get the tasks that this task depends on (predecessors).
     */
    public function predecessors(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'task_id', 'depends_on_task_id');
    }

    /**
     * Format the task into the schema required by the GNN recommendation inference script.
     *
     * @return array<string, mixed>
     */
    public function toGNNFeatureDict(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description ?? '',
            'task_classification' => $this->task_classification ?? '',
            'required_position' => $this->required_position ?? '',
            'minimum_experience_years' => (float) ($this->minimum_experience_years ?? 0.0),
            'task_difficulty' => $this->task_difficulty ?? 'Medium',
            'priority' => $this->priority ?? 'Medium',
            'estimated_hours' => (float) ($this->estimated_hours ?? 40.0),
            'days_until_deadline' => (int) ($this->days_until_deadline ?? 14),
            'target_macro_domains' => $this->target_macro_domains ?? [0, 0, 0, 0, 0, 0, 0, 0],
            'required_skills' => $this->required_skills ?? [],
        ];
    }
}
