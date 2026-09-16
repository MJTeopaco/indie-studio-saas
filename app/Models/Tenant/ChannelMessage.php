<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class ChannelMessage extends Model
{
    protected $fillable = [
        'channel_id',
        'user_id',
        'sender_name',
        'sender_role',
        'body',
        'attachments',
        'mentions',
        'reply_to_id',
        'reply_to',
        'is_pinned',
        'pinned_at',
        'pinned_by_user_id',
        'forwarded_from',
        'deleted_for_user_ids',
        'is_unsent',
        'unsent_at',
        'unsent_by_user_id',
        'unsent_by_name',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'attachments' => 'array',
            'mentions' => 'array',
            'reply_to_id' => 'integer',
            'reply_to' => 'array',
            'is_pinned' => 'boolean',
            'pinned_at' => 'datetime',
            'pinned_by_user_id' => 'integer',
            'forwarded_from' => 'array',
            'deleted_for_user_ids' => 'array',
            'is_unsent' => 'boolean',
            'unsent_at' => 'datetime',
            'unsent_by_user_id' => 'integer',
        ];
    }
}
