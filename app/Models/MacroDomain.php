<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MacroDomain extends Model
{
    use HasFactory, SoftDeletes, \Stancl\Tenancy\Database\Concerns\CentralConnection;

    protected $fillable = ['name'];

    /**
     * Get the micro-domains for this macro-domain.
     */
    public function microDomains(): HasMany
    {
        return $this->hasMany(MicroDomain::class);
    }
}
