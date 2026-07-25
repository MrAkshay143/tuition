<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Actions\ArchiveCourseAction;
use App\Domains\Course\Actions\RestoreCourseAction;
use Illuminate\Http\JsonResponse;

class CourseArchiveController extends Controller
{
    use ApiResponse;

    protected ArchiveCourseAction $archiveAction;
    protected RestoreCourseAction $restoreAction;

    public function __construct(ArchiveCourseAction $archiveAction, RestoreCourseAction $restoreAction)
    {
        $this->archiveAction = $archiveAction;
        $this->restoreAction = $restoreAction;
    }

    /**
     * PATCH /api/v1/courses/{id}/archive
     */
    public function archive(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course = $this->archiveAction->execute($course);

        return $this->success($course, 'Course archived successfully.');
    }

    /**
     * PATCH /api/v1/courses/{id}/restore
     */
    public function restore(int $id): JsonResponse
    {
        // Include soft deleted when searching
        $course = Course::withTrashed()->findOrFail($id);
        $course = $this->restoreAction->execute($course);

        return $this->success($course, 'Course restored successfully.');
    }
}
