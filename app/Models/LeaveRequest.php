<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class LeaveRequest extends Model
{
    use HasFactory, CentralConnection;

    protected $table = 'leave_requests';

    protected $fillable = [
        'studio_id',
        'user_id',
        'requester_role',
        'leave_start_date',
        'leave_end_date',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'leave_start_date' => 'date:Y-m-d',
            'leave_end_date' => 'date:Y-m-d',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * The requesting member or team leader.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The leader or owner who reviewed/approved the request.
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * The studio workspace.
     */
    public function studio(): BelongsTo
    {
        return $this->belongsTo(Studio::class, 'studio_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForStudio($query, string $studioId)
    {
        return $query->where('studio_id', $studioId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
