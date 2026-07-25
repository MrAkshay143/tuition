<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseVersion;
use App\Domains\Course\Actions\CreateCourseVersionAction;
use App\Domains\Course\Actions\RestoreCourseVersionAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CourseVersionController extends Controller
{
    use ApiResponse;

    protected CreateCourseVersionAction $createAction;
    protected RestoreCourseVersionAction $restoreAction;

    public function __construct(
        CreateCourseVersionAction $createAction,
        RestoreCourseVersionAction $restoreAction
    ) {
        $this->createAction = $createAction;
        $this->restoreAction = $restoreAction;
    }

    /**
     * GET /api/v1/courses/{courseId}/versions
     */
    public function index(int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $versions = $course->versions()->with('creator:id,name')->get();

        return $this->success($versions, 'Course versions retrieved successfully.');
    }

    /**
     * POST /api/v1/courses/{courseId}/versions
     */
    public function store(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $request->validate(['change_summary' => 'nullable|string|max:250']);

        $version = $this->createAction->execute(
            $course,
            $request->user()?->id ?? 1,
            $request->change_summary
        );

        return $this->success($version, 'Course version saved successfully.', 201);
    }

    /**
     * POST /api/v1/courses/{courseId}/versions/{versionId}/restore
     */
    public function restore(int $courseId, int $versionId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $version = CourseVersion::where('course_id', $courseId)->findOrFail($versionId);

        $restoredCourse = $this->restoreAction->execute($course, $version);

        return $this->success($restoredCourse, 'Course restored to selected version successfully.');
    }
}
