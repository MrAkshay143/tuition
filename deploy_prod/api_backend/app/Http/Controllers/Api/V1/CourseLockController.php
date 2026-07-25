<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Actions\AcquireCourseLockAction;
use App\Domains\Course\Actions\ReleaseCourseLockAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CourseLockController extends Controller
{
    use ApiResponse;

    protected AcquireCourseLockAction $acquireAction;
    protected ReleaseCourseLockAction $releaseAction;

    public function __construct(
        AcquireCourseLockAction $acquireAction,
        ReleaseCourseLockAction $releaseAction
    ) {
        $this->acquireAction = $acquireAction;
        $this->releaseAction = $releaseAction;
    }

    /**
     * POST /api/v1/courses/{courseId}/lock
     */
    public function lock(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $userId = $request->user()?->id ?? 1;

        $session = $this->acquireAction->execute($course, $userId);

        return $this->success($session, 'Course editing lock acquired/renewed successfully.');
    }

    /**
     * POST /api/v1/courses/{courseId}/unlock
     */
    public function unlock(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $userId = $request->user()?->id ?? 1;

        $this->releaseAction->execute($course, $userId);

        return $this->success(null, 'Course editing lock released successfully.');
    }
}
