<?php

namespace App\Models;

use App\Models\Tenant\UserDomain;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'role', 'avatar', 'working_status', 'leave_start_date', 'leave_end_date'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, \Stancl\Tenancy\Database\Concerns\CentralConnection;

    /** Role constants — use these instead of magic strings throughout the app */
    const ROLE_PROGRAMMER = 'programmer';

    const ROLE_ADMIN = 'admin';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'leave_start_date' => 'date',
            'leave_end_date' => 'date',
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
    public function joinedStudios(): BelongsToMany
    {
        return $this->belongsToMany(Studio::class, 'studio_members', 'user_id', 'studio_id')
            ->withPivot(['role', 'working_status', 'leave_start_date', 'leave_end_date', 'leave_request_status'])
            ->withTimestamps();
    }

    /**
     * Get all leave requests submitted by this user.
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'user_id');
    }

    /**
     * Check and sync working status based on leave timeline dates.
     * - If leave_end_date has passed, conclude leave and restore status to 'active'.
     * - If leave_start_date is in the future, user must remain 'active' until the start date.
     * - If today falls within [leave_start_date, leave_end_date], activate 'on_leave'.
     * Also synchronizes studio_members records.
     */
    public function checkAndResolveLeaveStatus(): void
    {
        $today = now()->toDateString();

        // 1. If leave has expired (today > leave_end_date)
        if ($this->leave_end_date && $today > Carbon::parse($this->leave_end_date)->toDateString()) {
            if ($this->working_status === 'on_leave') {
                $this->working_status = 'active';
            }
            $this->leave_start_date = null;
            $this->leave_end_date = null;
            $this->save();
        } elseif ($this->leave_start_date && $today < Carbon::parse($this->leave_start_date)->toDateString()) {
            // 2. If leave starts in the future (today < leave_start_date), user is still active today
            if ($this->working_status === 'on_leave') {
                $this->working_status = 'active';
                $this->save();
            }
        } elseif ($this->leave_start_date && $this->leave_end_date) {
            // 3. If today falls within [leave_start_date, leave_end_date]
            $startDate = Carbon::parse($this->leave_start_date)->toDateString();
            $endDate = Carbon::parse($this->leave_end_date)->toDateString();
            if ($today >= $startDate && $today <= $endDate) {
                if ($this->working_status !== 'emergency' && $this->working_status !== 'on_leave') {
                    $this->working_status = 'on_leave';
                    $this->save();
                }
            }
        }

        // Synchronize studio_members records for this user
        self::resolveStudioMembersLeaveStatus(null, $this->id);
    }

    /**
     * Resolve leave statuses for studio members based on today's date.
     * - Expired: reverts to 'active', clears dates and request status.
     * - Future: if mistakenly 'on_leave', reverts to 'active'.
     * - Ongoing (today between start and end): sets 'on_leave' if approved/owner and not emergency.
     */
    public static function resolveStudioMembersLeaveStatus(?string $studioId = null, ?int $userId = null): void
    {
        $today = now()->toDateString();
        $baseQuery = DB::connection(config('tenancy.database.central_connection', 'central'))
            ->table('studio_members');

        if ($studioId) {
            $baseQuery->where('studio_id', $studioId);
        }
        if ($userId) {
            $baseQuery->where('user_id', $userId);
        }

        // 1. Expired leaves
        (clone $baseQuery)
            ->where('working_status', 'on_leave')
            ->whereNotNull('leave_end_date')
            ->where('leave_end_date', '<', $today)
            ->update([
                'working_status' => 'active',
                'leave_start_date' => null,
                'leave_end_date' => null,
                'leave_request_status' => 'none',
                'updated_at' => now(),
            ]);

        // 2. Future leaves mistakenly set to 'on_leave'
        (clone $baseQuery)
            ->where('working_status', 'on_leave')
            ->whereNotNull('leave_start_date')
            ->where('leave_start_date', '>', $today)
            ->update([
                'working_status' => 'active',
                'updated_at' => now(),
            ]);

        // 3. Ongoing approved leaves that have now reached today's date
        (clone $baseQuery)
            ->where('working_status', '!=', 'emergency')
            ->where('working_status', '!=', 'on_leave')
            ->whereNotNull('leave_start_date')
            ->whereNotNull('leave_end_date')
            ->where('leave_start_date', '<=', $today)
            ->where('leave_end_date', '>=', $today)
            ->where(function ($q) {
                $q->where('leave_request_status', 'approved')
                    ->orWhere('role', 'owner');
            })
            ->update([
                'working_status' => 'on_leave',
                'updated_at' => now(),
            ]);
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    /**
     * Get the developer's micro-domains (cross-database query).
     * Retrieves the pivot records from the current tenant database,
     * then fetches the corresponding MicroDomain records from the central database.
     *
     * @return Collection
     */
    public function microDomains()
    {
        // Get the micro_domain_ids for this user from the tenant database
        $microDomainIds = UserDomain::where('user_id', $this->id)
            ->pluck('micro_domain_id');

        // Fetch the actual MicroDomain models from the central database
        return MicroDomain::whereIn('id', $microDomainIds)->get();
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'can_create_studio',
    ];

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

    /**
     * Determine if this user is a studio owner, leader, or administrator.
     */
    public function isOwnerOrLeader(): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if ($this->ownedStudios()->exists()) {
            return true;
        }

        return $this->joinedStudios()
            ->wherePivotIn('role', ['owner', 'leader', 'manager'])
            ->exists();
    }

    /**
     * Determine if this user is authorized to create a studio.
     */
    public function canCreateStudio(): bool
    {
        return $this->isOwnerOrLeader();
    }

    /**
     * Accessor for can_create_studio attribute.
     */
    public function getCanCreateStudioAttribute(): bool
    {
        return $this->canCreateStudio();
    }
}

