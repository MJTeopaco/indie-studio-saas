<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class ChannelRead extends Model
{
    protected $fillable = [
        'channel_id',
        'user_id',
        'last_read_message_id',
        'last_read_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'last_read_message_id' => 'integer',
            'last_read_at' => 'datetime',
        ];
    }
}
