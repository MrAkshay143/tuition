<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\ActivityLog;

class RestoreCourseAction
{
    /**
     * Restore a soft-deleted course.
     */
    public function execute(Course $course): Course
    {
        $course->restore();

        ActivityLog::record(
            'course_restored',
            "Course '{$course->title}' has been restored."
        );

        return $course;
    }
}
