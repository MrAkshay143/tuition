<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\DTOs\CreateCourseDTO;
use App\Domains\Core\Models\ActivityLog;

class CreateCourseAction
{
    /**
     * Create a new course, then sync batch assignments if provided.
     */
    public function execute(CreateCourseDTO $dto): Course
    {
        $course = Course::create($dto->toArray());

        // Sync batch_ids via the batch_course pivot (non-destructive)
        if (!empty($dto->batchIds)) {
            $course->batches()->syncWithoutDetaching($dto->batchIds);
        }

        ActivityLog::record(
            'course_created',
            "Course '{$course->title}' has been created."
        );

        return $course->load('program', 'subject');
    }
}
