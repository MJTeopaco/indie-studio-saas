<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AiChatSession extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['id', 'user_id', 'title', 'messages'];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'messages' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($session) {
            $session->id ??= (string) Str::uuid();
        });
    }
}
