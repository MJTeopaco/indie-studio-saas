<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $table = 'reports';

    protected $fillable = [
        'name',
        'type',
        'project_id',
        'employee_user_id',
        'target_name',
        'orientation',
        'created_by',
        'created_by_user_id',
        'metrics',
    ];

    protected $casts = [
        'metrics' => 'array',
        'project_id' => 'integer',
        'employee_user_id' => 'integer',
        'created_by_user_id' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}
