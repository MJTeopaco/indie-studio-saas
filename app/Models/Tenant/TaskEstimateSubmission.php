<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskEstimateSubmission extends Model
{
    use HasFactory;
    
    public $timestamps = false;
    
    protected $fillable = [
        'task_id',
        'developer_id',
        'submitted_points',
        'submitted_at',
    ];
    
    protected $casts = [
        'submitted_at' => 'datetime',
        'submitted_points' => 'integer',
        'task_id' => 'integer',
        'developer_id' => 'integer',
    ];
    
    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
