<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

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
     * Stub for the Fork middleware logic.
     */
    public function ownedStudios()
    {
        // TODO: Implement actual tenant relationship (e.g. return $this->hasMany(Tenant::class, 'owner_id'))
        // For now, return a dummy relationship or query builder that returns false for exists()
        return $this->hasMany(GlobalProfile::class)->where('id', -1); // Dummy relationship that will return empty
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

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
