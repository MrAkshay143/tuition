<?php

namespace App\Domains\LiveClass\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Support\Traits\HasOwner;

class LiveClass extends Model
{
    use SoftDeletes, HasOwner;

    protected $table = 'live_classes';

    protected $fillable = [
        'title', 'description', 'provider', 'meeting_id', 'meeting_url', 'password',
        'scheduled_at', 'duration_minutes', 'status', 'recording_url',
        'host_link', 'join_before_minutes', 'waiting_room',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function batches()
    {
        return $this->belongsToMany(\App\Domains\Core\Models\Batch::class, 'batch_live_class', 'live_class_id', 'batch_id');
    }

    public function teacher()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'teacher_id');
    }

    public function attendance()
    {
        return $this->hasMany(LiveClassAttendance::class, 'live_class_id');
    }
}
