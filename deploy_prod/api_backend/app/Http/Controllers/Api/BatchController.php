<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\ApiController;
use App\Models\Batch;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Resources\V1\BatchResource;
use App\Http\Resources\V1\PaginatedResource;
use App\Http\Resources\V1\UserResource;

class BatchController extends ApiController
{
    public function index(
        \App\Domains\Core\Requests\Batch\GetBatchesRequest $request,
        \App\Domains\Core\Actions\Batch\GetBatchesAction $action
    ) {
        $paginator = $action->execute($request->user(), $request);
        return (new PaginatedResource($paginator))->toResponse($request);
    }

    public function show(
        \App\Domains\Core\Requests\Batch\GetBatchRequest $request,
        \App\Domains\Core\Actions\Batch\GetBatchAction $action
    ) {
        $batch = $action->execute($request->route('id'), $request->query('include'));
        return $this->success(
            data: new BatchResource($batch),
            message: 'Batch details retrieved successfully.'
        );
    }

    public function students(
        \App\Domains\Core\Requests\Batch\GetBatchStudentsRequest $request,
        \App\Domains\Core\Actions\Batch\GetBatchStudentsAction $action
    ) {
        $students = $action->execute($request->route('id'));
        return response()->json([
            'success' => true,
            'message' => 'Batch students retrieved successfully.',
            'data' => UserResource::collection($students->items()),
            'meta' => [
                'total' => $students->total(),
                'current_page' => $students->currentPage()
            ],
            'errors' => null
        ]);
    }

    public function store(
        \App\Domains\Core\Requests\Batch\StoreBatchRequest $request,
        \App\Domains\Core\Actions\Batch\StoreBatchAction $action
    ) {
        $batch = $action->execute($request->user(), $request->validated());
        return $this->success(
            data: new BatchResource($batch),
            message: 'Batch created successfully.',
            status: 201
        );
    }

    public function update(
        \App\Domains\Core\Requests\Batch\UpdateBatchRequest $request,
        \App\Domains\Core\Actions\Batch\UpdateBatchAction $action
    ) {
        $batch = $action->execute($request->user(), $request->route('id'), $request->validated());
        return $this->success(
            data: new BatchResource($batch),
            message: 'Batch updated successfully.'
        );
    }

    public function destroy(
        \App\Domains\Core\Requests\Batch\DeleteBatchRequest $request,
        \App\Domains\Core\Actions\Batch\DeleteBatchAction $action
    ) {
        $action->execute($request->route('id'));
        return $this->success(message: 'Batch deleted successfully.');
    }

    public function syncStudents(
        \App\Domains\Core\Requests\Batch\SyncBatchStudentsRequest $request,
        \App\Domains\Core\Actions\Batch\SyncBatchStudentsAction $action
    ) {
        $action->execute($request->route('id'), $request->validated('student_ids'));
        return $this->success(message: 'Students added to batch successfully.');
    }

    public function removeStudents(
        \App\Domains\Core\Requests\Batch\RemoveBatchStudentsRequest $request,
        \App\Domains\Core\Actions\Batch\RemoveBatchStudentsAction $action
    ) {
        $action->execute($request->route('id'), $request->validated('student_ids'));
        return $this->success(message: 'Students removed from batch successfully.');
    }

    public function removeStudent(int $id, int $studentId)
    {
        $batch = \App\Domains\Core\Models\Batch::findOrFail($id);
        $batch->students()->detach($studentId);

        return $this->success(message: 'Student removed from batch successfully.');
    }

    public function courses(int $id)
    {
        $batch = \App\Domains\Core\Models\Batch::findOrFail($id);
        $courses = $batch->courses;
        return response()->json([
            'success' => true,
            'message' => 'Batch courses retrieved successfully.',
            'data'    => $courses,
            'errors'  => null,
        ]);
    }

    public function assignCourses(Request $request, int $id)
    {
        $request->validate([
            'course_ids'   => 'required|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        $batch = \App\Domains\Core\Models\Batch::findOrFail($id);
        $batch->courses()->syncWithoutDetaching($request->input('course_ids'));

        return $this->success(message: 'Courses assigned to batch successfully.');
    }

    public function removeCourses(Request $request, int $id)
    {
        $request->validate([
            'course_ids'   => 'required|array',
            'course_ids.*' => 'exists:courses,id',
        ]);

        $batch = \App\Domains\Core\Models\Batch::findOrFail($id);
        $batch->courses()->detach($request->input('course_ids'));

        return $this->success(message: 'Courses removed from batch successfully.');
    }


}

