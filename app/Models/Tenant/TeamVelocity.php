<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeamVelocity extends Model
{
    use HasFactory;
    
    protected $table = 'team_velocity';
    
    protected $fillable = [
        'team_id',
        'sprint_id',
        'points_committed',
        'points_completed',
        'computed_at',
    ];
    
    protected $casts = [
        'computed_at' => 'datetime',
        'points_committed' => 'integer',
        'points_completed' => 'integer',
        'team_id' => 'integer',
        'sprint_id' => 'integer',
    ];

    /**
     * Get the sprint this velocity record belongs to.
     */
    public function sprint()
    {
        return $this->belongsTo(Sprint::class, 'sprint_id');
    }
}
