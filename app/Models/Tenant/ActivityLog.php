<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    protected $fillable = [
        'subject_type', 'subject_id', 'field',
        'old_value', 'new_value', 'user_id', 'user_name',
    ];
}
