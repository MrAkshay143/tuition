<?php

namespace App\Domains\Learning\Models;

use Illuminate\Database\Eloquent\Model;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;

class CourseCompletion extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'completed_percentage',
        'completed_at',
        'certificate_id',
        'certificate_generated',
    ];

    protected $casts = [
        'completed_at'          => 'datetime',
        'certificate_generated' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
