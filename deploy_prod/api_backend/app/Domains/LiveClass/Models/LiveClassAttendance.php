<?php

namespace App\Domains\LiveClass\Models;

use Illuminate\Database\Eloquent\Model;

class LiveClassAttendance extends Model
{
    protected $table = 'attendance';

    protected $fillable = ['live_class_id', 'user_id', 'joined_at', 'left_at', 'duration_seconds'];
    protected $casts    = ['joined_at' => 'datetime', 'left_at' => 'datetime'];

    public function liveClass()
    {
        return $this->belongsTo(LiveClass::class, 'live_class_id');
    }

    public function student()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'user_id');
    }
}
