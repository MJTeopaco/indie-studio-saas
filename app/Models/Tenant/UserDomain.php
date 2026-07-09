<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class UserDomain extends Model
{
    protected $table = 'user_domains';

    public $incrementing = false;
    public $timestamps = false;
    protected $primaryKey = null;

    protected $fillable = [
        'user_id',
        'micro_domain_id',
    ];
}
