<?php

namespace App\Domains\Notification\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    public    $incrementing = false;
    protected $keyType      = 'string';
    protected $fillable     = ['id', 'user_id', 'type', 'icon', 'title', 'body', 'data', 'read_at'];
    protected $casts        = ['data' => 'array', 'read_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class);
    }
}
