<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    use HasFactory, \Stancl\Tenancy\Database\Concerns\CentralConnection;

    protected $fillable = ['name'];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * Get all global profiles that use this position.
     * Used to check before deleting a position (restrictOnDelete in migration).
     */
    public function globalProfiles(): HasMany
    {
        return $this->hasMany(GlobalProfile::class);
    }
}
