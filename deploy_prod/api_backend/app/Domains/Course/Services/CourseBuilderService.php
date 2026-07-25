<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Actions\DuplicateCourseAction;

class CourseBuilderService
{
    protected $duplicateAction;

    public function __construct(DuplicateCourseAction $duplicateAction)
    {
        $this->duplicateAction = $duplicateAction;
    }

    public function duplicate(Course $course, int $teacherId): Course
    {
        return $this->duplicateAction->execute($course, $teacherId);
    }
}
