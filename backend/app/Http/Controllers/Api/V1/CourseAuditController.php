<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class CourseAuditController extends ApiController
{
    use ApiResponse;

    /**
     * GET /api/v1/courses/{id}/activity-logs
     */
    public function activityLogs(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        Gate::authorize('view', $course);

        $logs = $course->activityLogs()->with('user:id,name,email')->get();

        return $this->success($logs);
    }

    /**
     * GET /api/v1/courses/{id}/publish-history
     */
    public function publishHistory(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        Gate::authorize('view', $course);

        $history = $course->publishHistories()
            ->with(['user:id,name,email', 'courseVersion'])
            ->get();

        return $this->success($history);
    }
}
