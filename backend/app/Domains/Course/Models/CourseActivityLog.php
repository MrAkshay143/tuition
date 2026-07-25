<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;

class CourseActivityLog extends Model
{
    protected $table = 'course_activity_logs';
    protected $fillable = ['course_id', 'user_id', 'event', 'description', 'properties'];

    protected $casts = [
        'properties' => 'array',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class);
    }
}
