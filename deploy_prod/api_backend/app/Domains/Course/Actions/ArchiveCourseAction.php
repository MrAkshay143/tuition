<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Enums\CourseStatus;
use App\Domains\Core\Models\ActivityLog;

class ArchiveCourseAction
{
    /**
     * Archive a course.
     */
    public function execute(Course $course): Course
    {
        $course->update(['status' => CourseStatus::ARCHIVED->value]);

        ActivityLog::record(
            'course_archived',
            "Course '{$course->title}' has been archived."
        );

        return $course;
    }
}
