<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseVersion;
use App\Domains\Course\Actions\CreateCourseVersionAction;
use App\Domains\Course\Actions\RestoreCourseVersionAction;

class CourseVersionService
{
    protected $createAction;
    protected $restoreAction;

    public function __construct(CreateCourseVersionAction $createAction, RestoreCourseVersionAction $restoreAction)
    {
        $this->createAction = $createAction;
        $this->restoreAction = $restoreAction;
    }

    public function createVersion(Course $course, array $syllabus, string $summary, int $userId): CourseVersion
    {
        return $this->createAction->execute($course, $syllabus, $summary, $userId);
    }

    public function restoreVersion(CourseVersion $version, int $userId): Course
    {
        return $this->restoreAction->execute($version, $userId);
    }
}
