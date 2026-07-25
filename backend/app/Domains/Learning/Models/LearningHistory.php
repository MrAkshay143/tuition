<?php

namespace App\Domains\Learning\Models;

use Illuminate\Database\Eloquent\Model;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\Lesson;

class LearningHistory extends Model
{
    protected $table = 'learning_history';

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'course_id',
        'lesson_id',
        'action',
        'watch_seconds',
        'playback_speed',
        'device',
        'ip',
        'created_at',
    ];

    protected $casts = [
        'playback_speed' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}
