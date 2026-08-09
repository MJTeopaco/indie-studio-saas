<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MicroDomain extends Model
{
    use HasFactory, SoftDeletes, \Stancl\Tenancy\Database\Concerns\CentralConnection;

    protected $fillable = ['macro_domain_id', 'name'];

    /**
     * Get the macro-domain that owns this micro-domain.
     */
    public function macroDomain(): BelongsTo
    {
        return $this->belongsTo(MacroDomain::class);
    }
}
