<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseEditSession;
use App\Domains\Course\Actions\AcquireCourseLockAction;
use App\Domains\Course\Actions\ReleaseCourseLockAction;

class CourseLockService
{
    protected $acquireAction;
    protected $releaseAction;

    public function __construct(AcquireCourseLockAction $acquireAction, ReleaseCourseLockAction $releaseAction)
    {
        $this->acquireAction = $acquireAction;
        $this->releaseAction = $releaseAction;
    }

    public function lock(Course $course, int $userId, int $ttlMinutes = 15): CourseEditSession
    {
        return $this->acquireAction->execute($course, $userId, $ttlMinutes);
    }

    public function unlock(Course $course, int $userId): void
    {
        $this->releaseAction->execute($course, $userId);
    }
}
