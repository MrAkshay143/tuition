<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Models\User;
use App\Models\Batch;
use App\Models\Course;
use App\Models\LiveClass;
use App\Models\AssignmentSubmission;
use App\Models\Notification;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\Traits\ApiResponse;

/**
 * BundleController
 *
 * Each method loads ALL data needed for a full page in a single request.
 * This minimizes HTTP round-trips for data-heavy pages.
 */
class BundleController extends ApiController
{
    use ApiResponse;

    /**
     * GET /bundle/dashboard  [teacher]
     */
    public function teacherDashboard(\App\Domains\Core\Services\DashboardService $service)
    {
        return $this->success($service->getTeacherDashboard(auth()->user()));
    }

    /**
     * GET /bundle/student-dashboard  [student]
     */
    public function studentDashboard(\App\Domains\Core\Services\DashboardService $service)
    {
        return $this->success($service->getStudentDashboard(auth()->user()));
    }

    /**
     * GET /bundle/student-profile/{id}  [teacher]
     */
    public function studentProfile(int $id, \App\Domains\Core\Services\DashboardService $service)
    {
        $student = User::findOrFail($id);

        $user = auth()->user();
        if ($user && $user->role === 'student' && (int)$user->id !== (int)$id) {
            abort(403, 'Unauthorized access to student profile.');
        }
        if ($user && $user->role === 'teacher') {
            $isAssociated = $student->batches()->where('teacher_id', $user->id)->exists();
            if (!$isAssociated) {
                abort(403, 'Unauthorized access to student profile.');
            }
        }

        return $this->success($service->getStudentProfile($student));
    }

    /**
     * GET /bundle/admin-overview  [admin]
     */
    public function adminOverview(\App\Domains\Core\Services\DashboardService $service)
    {
        return $this->success($service->getAdminOverview());
    }

}

