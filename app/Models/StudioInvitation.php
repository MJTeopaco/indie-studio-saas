<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class StudioInvitation extends Model
{
    use CentralConnection;

    protected $fillable = [
        'studio_id',
        'invited_email',
        'token',
        'role',
        'expires_at',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function scopeValid(Builder $query): void
    {
        $query->whereNull('used_at')->where('expires_at', '>', now());
    }

    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
