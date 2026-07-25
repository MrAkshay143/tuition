<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;

class CoursePublishHistory extends Model
{
    protected $table = 'course_publish_history';
    protected $fillable = ['course_id', 'user_id', 'version', 'course_version_id', 'published_at'];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class);
    }

    public function courseVersion()
    {
        return $this->belongsTo(CourseVersion::class, 'course_version_id');
    }
}
