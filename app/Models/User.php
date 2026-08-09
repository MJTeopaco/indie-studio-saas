<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, \Stancl\Tenancy\Database\Concerns\CentralConnection;

    /** Role constants — use these instead of magic strings throughout the app */
    const ROLE_PROGRAMMER = 'programmer';
    const ROLE_ADMIN      = 'admin';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * Get the developer's Central Passport (global profile).
     * Returns null for admin accounts, which do not have a skill profile.
     */
    public function globalProfile(): HasOne
    {
        return $this->hasOne(GlobalProfile::class);
    }

    /**
     * Get the studios (tenants) owned by this user.
     */
    public function ownedStudios(): HasMany
    {
        return $this->hasMany(Studio::class, 'owner_id');
    }

    /**
     * Get the studios the user is a member of (including ones they own).
     */
    public function joinedStudios(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Studio::class, 'studio_members', 'user_id', 'studio_id')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    /**
     * Get the developer's micro-domains (cross-database query).
     * Retrieves the pivot records from the current tenant database,
     * then fetches the corresponding MicroDomain records from the central database.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function microDomains()
    {
        // Get the micro_domain_ids for this user from the tenant database
        $microDomainIds = \App\Models\Tenant\UserDomain::where('user_id', $this->id)
            ->pluck('micro_domain_id');

        // Fetch the actual MicroDomain models from the central database
        return MicroDomain::whereIn('id', $microDomainIds)->get();
    }

    /**
     * Determine if this user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Determine if this user is a developer/programmer.
     */
    public function isProgrammer(): bool
    {
        return $this->role === self::ROLE_PROGRAMMER;
    }
}
