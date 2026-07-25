<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Learning\Services\LearningAnalyticsService;
use App\Domains\Learning\Services\ResumeLearningService;
use App\Domains\Learning\Models\Enrollment;
use App\Domains\Learning\Models\CourseCompletion;
use App\Domains\Learning\Models\LearningHistory;

class GetDashboardAction
{
    public function __construct(
        protected LearningAnalyticsService $analyticsService,
        protected ResumeLearningService $resumeService
    ) {}

    public function execute(?User $user = null): array
    {
        if (!$user) {
            return [
                'analytics'        => null,
                'resume'           => null,
                'enrolled_courses' => [],
                'history'          => [],
            ];
        }

        $this->analyticsService->updateStreak($user);
        $analytics = $this->analyticsService->getAnalytics($user);
        $continueDetails = $this->resumeService->getResumeDetails($user);

        $enrollments = Enrollment::where('user_id', $user->id)
            ->where('status', 'active')
            ->with(['course'])
            ->get();

        $courseIds = $enrollments->pluck('course_id')->filter()->toArray();
        $completions = CourseCompletion::where('user_id', $user->id)
            ->whereIn('course_id', $courseIds)
            ->get()
            ->keyBy('course_id');

        $enrolledCourses = $enrollments->map(function ($enrollment) use ($completions) {
            $course = $enrollment->course;
            if (!$course) return null;
            $completion = $completions->get($course->id);

            return [
                'id'                   => $course->id,
                'title'                => $course->title,
                'description'          => $course->description,
                'thumbnail'            => $course->thumbnail,
                'completed_percentage' => $completion ? $completion->completed_percentage : 0,
            ];
        })->filter()->values();

        $history = LearningHistory::where('user_id', $user->id)
            ->with(['lesson', 'course'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($h) {
                return [
                    'id'            => $h->id,
                    'action'        => $h->action,
                    'watch_seconds' => $h->watch_seconds,
                    'created_at'    => $h->created_at,
                    'lesson_title'  => $h->lesson?->title,
                    'course_title'  => $h->course?->title,
                ];
            });

        return [
            'analytics'        => $analytics,
            'resume'           => $continueDetails,
            'enrolled_courses' => $enrolledCourses,
            'history'          => $history,
        ];
    }
}
