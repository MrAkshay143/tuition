<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Domains\Learning\Services\LearningProgressService;
use App\Domains\Learning\Services\LearningAnalyticsService;
use App\Domains\Learning\Services\ResumeLearningService;
use App\Domains\Learning\Models\LearningHistory;
use App\Domains\Learning\Models\Enrollment;
use App\Domains\Learning\Models\CourseCompletion;
use App\Domains\Course\Models\Lesson;
use App\Domains\Core\Traits\ApiResponse;

class StudentLearningController extends Controller
{
    use ApiResponse;

    protected $progressService;
    protected $analyticsService;
    protected $resumeService;

    public function __construct(
        LearningProgressService $progressService,
        LearningAnalyticsService $analyticsService,
        ResumeLearningService $resumeService
    ) {
        $this->progressService = $progressService;
        $this->analyticsService = $analyticsService;
        $this->resumeService = $resumeService;
    }

    /**
     * GET /api/v1/student/dashboard
     */
    public function dashboard(
        \App\Domains\Learning\Requests\GetDashboardRequest $request,
        \App\Domains\Learning\Actions\GetDashboardAction $action
    ): JsonResponse {
        $data = $action->execute($request->user());
        return $this->success($data);
    }

    public function progress(
        \App\Domains\Learning\Requests\GetProgressRequest $request,
        \App\Domains\Learning\Actions\GetProgressAction $action
    ): JsonResponse {
        $completions = $action->execute($request->user());
        return $this->success($completions);
    }

    public function history(
        \App\Domains\Learning\Requests\GetHistoryRequest $request,
        \App\Domains\Learning\Actions\GetHistoryAction $action
    ): JsonResponse {
        $history = $action->execute($request->user());
        return $this->success($history);
    }

    public function continueLearning(
        \App\Domains\Learning\Requests\GetContinueLearningRequest $request,
        \App\Domains\Learning\Actions\GetContinueLearningAction $action
    ): JsonResponse {
        $resumeDetails = $action->execute($request->user());
        return $this->success($resumeDetails);
    }

    /**
     * POST /api/v1/lessons/{lesson}/progress
     */
    public function updateProgress(
        \App\Domains\Learning\Requests\UpdateProgressRequest $request,
        \App\Domains\Learning\Actions\UpdateProgressAction $action,
        int $id
    ): JsonResponse {
        $progress = $action->execute($request->user(), $id, $request->validated());
        return $this->success([
            'message' => 'Progress updated successfully',
            'data'    => $progress
        ]);
    }

    public function complete(
        \App\Domains\Learning\Requests\CompleteLessonRequest $request,
        \App\Domains\Learning\Actions\CompleteLessonAction $action,
        int $id
    ): JsonResponse {
        $progress = $action->execute($request->user(), $id);
        return $this->success([
            'message' => 'Lesson marked completed',
            'data'    => $progress
        ]);
    }
}
