<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Studio extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $table = 'tenants';

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'owner_id',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(StudioInvitation::class, 'studio_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'studio_members', 'studio_id', 'user_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function members(): BelongsToMany
    {
        return $this->users();
    }
}
