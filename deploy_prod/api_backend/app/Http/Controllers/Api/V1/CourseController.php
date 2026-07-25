<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use App\Domains\Course\DTOs\CreateCourseDTO;
use App\Domains\Course\DTOs\UpdateCourseDTO;
use App\Domains\Course\Actions\CreateCourseAction;
use App\Domains\Course\Actions\UpdateCourseAction;
use App\Domains\Course\Actions\DeleteCourseAction;
use App\Domains\Course\Actions\RestoreCourseAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use Illuminate\Support\Facades\Gate;

class CourseController extends \App\Http\Controllers\ApiController
{
    public function __construct(
        protected CreateCourseAction $createAction,
        protected UpdateCourseAction $updateAction,
        protected DeleteCourseAction $deleteAction,
        protected RestoreCourseAction $restoreAction
    ) {}

    public function index(
        \App\Domains\Course\Requests\GetCoursesRequest $request,
        \App\Domains\Course\Actions\GetCoursesAction $action
    ): JsonResponse {
        $paginator = $action->execute($request->user(), $request);
        return (new \App\Http\Resources\V1\PaginatedResource($paginator))->toResponse($request);
    }

    public function show(
        \App\Domains\Course\Requests\GetCourseRequest $request,
        \App\Domains\Course\Actions\GetCourseAction $action,
        int $id
    ): JsonResponse {
        $course = $action->execute($id, $request->query('include'));
        return $this->success(
            data: new \App\Http\Resources\V1\CourseResource($course),
            message: 'Course details retrieved successfully.'
        );
    }

    /**
     * POST /api/v1/courses
     */
    public function store(
        \App\Domains\Course\Requests\StoreCourseRequest $request
    ): JsonResponse {
        $data = $request->validated();
        
        $teacherId = $request->user()?->id ?? 1;
        if ($request->user()?->isAdmin()) {
            if (!empty($data['teacher_id'])) {
                $teacherId = $data['teacher_id'];
            } else {
                $singleTeacher = \App\Domains\Core\Models\User::teachers()->first();
                if ($singleTeacher && \App\Domains\Core\Models\User::teachers()->count() === 1) {
                    $teacherId = $singleTeacher->id;
                }
            }
        }

        $dto = CreateCourseDTO::fromArray([
            ...$data,
            'teacher_id' => $teacherId,
        ]);

        $course = $this->createAction->execute($dto);

        return $this->success(
            data: new \App\Http\Resources\V1\CourseResource($course),
            message: 'Course created successfully.',
            status: 201
        );
    }

    public function update(
        \App\Domains\Course\Requests\UpdateCourseRequest $request,
        int $id
    ): JsonResponse {
        $course = Course::findOrFail($id);
        $data = $request->validated();

        if (!$request->user()?->isAdmin()) {
            unset($data['teacher_id']);
        }

        $dto = UpdateCourseDTO::fromArray($data);
        $course = $this->updateAction->execute($course, $dto);

        return $this->success(
            data: new \App\Http\Resources\V1\CourseResource($course),
            message: 'Course updated successfully.'
        );
    }

    public function destroy(
        \App\Domains\Course\Requests\DeleteCourseRequest $request,
        int $id
    ): JsonResponse {
        $course = Course::findOrFail($id);
        $this->deleteAction->execute($course);

        return $this->success(message: 'Course deleted successfully.');
    }
}
