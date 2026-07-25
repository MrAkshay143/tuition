<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Actions\DuplicateCourseAction;
use Illuminate\Http\JsonResponse;

class CourseDuplicateController extends Controller
{
    use ApiResponse;

    protected DuplicateCourseAction $duplicateAction;

    public function __construct(DuplicateCourseAction $duplicateAction)
    {
        $this->duplicateAction = $duplicateAction;
    }

    /**
     * POST /api/v1/courses/{id}/duplicate
     */
    public function __invoke(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $duplicated = $this->duplicateAction->execute($course);

        return $this->success($duplicated, 'Course duplicated successfully.', 201);
    }
}
