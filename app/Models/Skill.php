<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    use HasFactory, \Stancl\Tenancy\Database\Concerns\CentralConnection;

    protected $fillable = ['name', 'category'];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * Get all global profiles that have this skill.
     * Useful for analytics: "How many developers on the platform know Python?"
     */
    public function globalProfiles(): BelongsToMany
    {
        return $this->belongsToMany(GlobalProfile::class, 'global_profile_skill')
            ->withPivot('proficiency_level')
            ->withTimestamps();
    }
}
