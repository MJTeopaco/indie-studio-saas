<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $table = 'reports';

    protected $fillable = [
        'name',
        'type',
        'target_name',
        'created_by',
        'metrics',
    ];

    protected $casts = [
        'metrics' => 'array',
    ];
}
