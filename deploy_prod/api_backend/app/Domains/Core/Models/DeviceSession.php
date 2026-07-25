<?php

namespace App\Domains\Core\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceSession extends Model
{
    protected $fillable = ['user_id', 'token_id', 'device_name', 'user_agent', 'ip_address', 'last_active_at'];
    protected $casts    = ['last_active_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
