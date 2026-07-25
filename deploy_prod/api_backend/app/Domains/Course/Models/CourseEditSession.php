<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;

class CourseEditSession extends Model
{
    protected $fillable = [
        'course_id', 'user_id', 'locked_at', 'expires_at', 'last_activity_at'
    ];

    protected $casts = [
        'locked_at'        => 'datetime',
        'expires_at'       => 'datetime',
        'last_activity_at' => 'datetime'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
