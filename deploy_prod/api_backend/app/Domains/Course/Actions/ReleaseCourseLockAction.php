<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseEditSession;

class ReleaseCourseLockAction
{
    public function execute(Course $course, int $userId): void
    {
        CourseEditSession::where('course_id', $course->id)
            ->where('user_id', $userId)
            ->delete();
    }
}
