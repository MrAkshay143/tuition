<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Actions\PublishCourseAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CoursePublishController extends Controller
{
    use ApiResponse;

    protected PublishCourseAction $publishAction;

    public function __construct(PublishCourseAction $publishAction)
    {
        $this->publishAction = $publishAction;
    }

    /**
     * PATCH /api/v1/courses/{id}/publish
     */
    public function __invoke(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $publish = $request->boolean('publish', true);

        $course = $this->publishAction->execute($course, $publish);

        $message = $publish ? 'Course published successfully.' : 'Course unpublished to draft.';
        return $this->success($course, $message);
    }
}
