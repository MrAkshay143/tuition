<?php

namespace App\Domains\Learning\Models;

use Illuminate\Database\Eloquent\Model;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Lesson;

class LearningSession extends Model
{
    protected $fillable = [
        'user_id',
        'lesson_id',
        'watch_seconds',
        'last_position',
        'playback_speed',
        'device_id',
    ];

    protected $casts = [
        'playback_speed' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}
