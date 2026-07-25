<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\ActivityLog;

class DeleteCourseAction
{
    /**
     * Delete (soft-delete) a course.
     */
    public function execute(Course $course): bool
    {
        $title = $course->title;
        $deleted = $course->delete();

        if ($deleted) {
            ActivityLog::record(
                'course_deleted',
                "Course '{$title}' has been deleted."
            );
        }

        return $deleted;
    }
}
