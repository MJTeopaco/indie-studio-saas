<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EpicGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'goal',
        'is_default',
        'display_order',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'display_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function epics(): HasMany
    {
        return $this->hasMany(Epic::class);
    }
}
