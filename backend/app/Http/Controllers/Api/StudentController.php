<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class StudentController extends ApiController
{
    /**
     * GET /students
     * Supports: search, active filter, include (batches), per_page, cursor
     */
    public function index(
        \App\Domains\Core\Requests\Student\GetStudentsRequest $request,
        \App\Domains\Core\Actions\Student\GetStudentsAction $action
    ) {
        $paginator = $action->execute($request->user(), $request);
        return (new \App\Http\Resources\V1\PaginatedResource($paginator))->toResponse($request);
    }

    /**
     * GET /students/{id}
     */
    public function show(
        \App\Domains\Core\Requests\Student\GetStudentRequest $request,
        \App\Domains\Core\Actions\Student\GetStudentAction $action
    ) {
        $student = $action->execute($request->route('id'), $request->query('include'));
        return $this->success(
            data: new \App\Http\Resources\V1\StudentResource($student),
            message: 'Student details retrieved successfully.'
        );
    }

    /**
     * POST /students
     */
    public function store(
        \App\Domains\Core\Requests\Student\StoreStudentRequest $request,
        \App\Domains\Core\Actions\Student\StoreStudentAction $action
    ) {
        $student = $action->execute($request->toDTO());

        return $this->success(
            data: new \App\Http\Resources\V1\StudentResource($student),
            message: 'Student created successfully.',
            status: 201
        );
    }

    /**
     * PUT /students/{id}
     */
    public function update(
        \App\Domains\Core\Requests\Student\UpdateStudentRequest $request,
        \App\Domains\Core\Actions\Student\UpdateStudentAction $action
    ) {
        $student = $action->execute($request->toDTO());

        return $this->success(
            data: new \App\Http\Resources\V1\StudentResource($student),
            message: 'Student updated successfully.'
        );
    }

    /**
     * DELETE /students/{id}
     */
    public function destroy(
        \App\Domains\Core\Requests\Student\DeleteStudentRequest $request,
        \App\Domains\Core\Actions\Student\DeleteStudentAction $action
    ) {
        $action->execute($request->studentId());

        return $this->success(
            message: 'Student deleted successfully.'
        );
    }

    /**
     * PUT /students/{id}/toggle-active
     */
    public function toggleActive(
        \App\Domains\Core\Requests\Student\ToggleStudentActiveRequest $request,
        \App\Domains\Core\Actions\Student\ChangeStudentStatusAction $action
    ) {
        $student = $action->execute($request->route('id'), $request->validated('active'), $request->validated('active') ? 'activated' : 'deactivated');
        return $this->success(new \App\Http\Resources\V1\StudentResource($student));
    }

    /**
     * GET /students/{id}/devices
     */
    public function devices(\App\Domains\Core\Requests\Student\ViewStudentDevicesRequest $request)
    {
        $student = User::students()->findOrFail($request->studentId());
        $sessions = $student->userSessions()->latest()->get();
        // Returning raw for now as there's no DeviceSessionResource yet
        return $this->success($sessions);
    }

    /**
     * POST /students/{id}/force-logout
     */
    public function forceLogout(
        \App\Domains\Core\Requests\Student\ForceLogoutStudentRequest $request,
        \App\Domains\Core\Actions\Student\ForceLogoutStudentAction $action
    ) {
        $action->execute($request->studentId());
        return $this->success(message: 'Student logged out of all devices successfully.');
    }

    /**
     * POST /students/{id}/lock
     */
    public function lock(
        \App\Domains\Core\Requests\Student\LockStudentRequest $request,
        \App\Domains\Core\Actions\Student\ChangeStudentStatusAction $action
    ) {
        $action->execute($request->studentId(), false, 'locked');
        return $this->success(message: 'Student account locked successfully.');
    }

    /**
     * POST /students/{id}/unlock
     */
    public function unlock(
        \App\Domains\Core\Requests\Student\UnlockStudentRequest $request,
        \App\Domains\Core\Actions\Student\ChangeStudentStatusAction $action
    ) {
        $action->execute($request->studentId(), true, 'unlocked');
        return $this->success(message: 'Student account unlocked successfully.');
    }

    /**
     * POST /students/{id}/suspend
     */
    public function suspend(
        \App\Domains\Core\Requests\Student\SuspendStudentRequest $request,
        \App\Domains\Core\Actions\Student\ChangeStudentStatusAction $action
    ) {
        $action->execute($request->studentId(), false, 'suspended');
        return $this->success(message: 'Student suspended successfully.');
    }

    /**
     * POST /students/{id}/activate
     */
    public function activate(
        \App\Domains\Core\Requests\Student\ActivateStudentRequest $request,
        \App\Domains\Core\Actions\Student\ChangeStudentStatusAction $action
    ) {
        $action->execute($request->studentId(), true, 'activated');
        return $this->success(message: 'Student activated successfully.');
    }

    /**
     * POST /students/{id}/assign-course
     */
    public function assignCourse(
        \App\Domains\Core\Requests\Student\AssignStudentCourseRequest $request,
        \App\Domains\Core\Actions\Student\AssignStudentCourseAction $action
    ) {
        $action->execute($request->toDTO());
        return $this->success(message: 'Courses assigned successfully.');
    }

    /**
     * POST /students/{id}/remove-course
     */
    public function removeCourse(
        \App\Domains\Core\Requests\Student\RemoveStudentCourseRequest $request,
        \App\Domains\Core\Actions\Student\RemoveStudentCourseAction $action
    ) {
        $action->execute($request->toDTO());
        return $this->success(message: 'Courses removed successfully.');
    }

    /**
     * POST /students/{id}/assign-batch
     */
    public function assignBatch(
        \App\Domains\Core\Requests\Student\AssignStudentBatchRequest $request,
        \App\Domains\Core\Actions\Student\AssignStudentBatchAction $action
    ) {
        $action->execute($request->toDTO());
        return $this->success(message: 'Batch assignments updated successfully.');
    }

    /**
     * POST /students/{id}/remove-batch
     */
    public function removeBatch(
        \App\Domains\Core\Requests\Student\RemoveStudentBatchRequest $request,
        \App\Domains\Core\Actions\Student\RemoveStudentBatchAction $action
    ) {
        $action->execute($request->toDTO());
        return $this->success(message: 'Batch assignments removed successfully.');
    }

    /**
     * POST /students/{id}/reset-password
     */
    public function resetPassword(
        \App\Domains\Core\Requests\Student\ResetStudentPasswordRequest $request,
        \App\Domains\Core\Actions\Student\ResetStudentPasswordAction $action
    ) {
        $action->execute($request->route('id'), $request->validated('password'));
        return $this->success(message: 'Password reset successfully.');
    }

    /**
     * POST /students/{id}/send-notification
     */
    public function sendNotification(
        \App\Domains\Core\Requests\Student\SendStudentNotificationRequest $request,
        \App\Domains\Core\Actions\Student\SendStudentNotificationAction $action
    ) {
        $action->execute($request->route('id'), $request->validated('title'), $request->validated('body'));
        return $this->success(message: 'Notification dispatched successfully.');
    }


    /**
     * POST /students/bulk/suspend
     */
    public function bulkSuspend(
        \App\Domains\Core\Requests\Student\BulkSuspendStudentRequest $request,
        \App\Domains\Core\Actions\Student\BulkChangeStudentStatusAction $action
    ) {
        $result = $action->execute($request->validated('student_ids'), false, 'suspended');
        return $this->success(data: $result);
    }

    /**
     * POST /students/bulk/activate
     */
    public function bulkActivate(
        \App\Domains\Core\Requests\Student\BulkActivateStudentRequest $request,
        \App\Domains\Core\Actions\Student\BulkChangeStudentStatusAction $action
    ) {
        $result = $action->execute($request->validated('student_ids'), true, 'activated');
        return $this->success(data: $result);
    }

    /**
     * POST /students/bulk/logout
     */
    public function bulkLogout(
        \App\Domains\Core\Requests\Student\BulkLogoutStudentRequest $request,
        \App\Domains\Core\Actions\Student\BulkLogoutStudentAction $action
    ) {
        $result = $action->execute($request->validated('student_ids'));
        return $this->success(data: $result);
    }

    /**
     * POST /students/bulk/assign-course
     */
    public function bulkAssignCourse(
        \App\Domains\Core\Requests\Student\BulkAssignStudentCourseRequest $request,
        \App\Domains\Core\Actions\Student\BulkAssignStudentCourseAction $action
    ) {
        $result = $action->execute($request->validated('student_ids'), $request->validated('course_ids'));
        return $this->success(data: $result);
    }

    /**
     * POST /students/bulk/assign-batch
     */
    public function bulkAssignBatch(
        \App\Domains\Core\Requests\Student\BulkAssignStudentBatchRequest $request,
        \App\Domains\Core\Actions\Student\BulkAssignStudentBatchAction $action
    ) {
        $result = $action->execute($request->validated('student_ids'), $request->validated('batch_ids'));
        return $this->success(data: $result);
    }
}

