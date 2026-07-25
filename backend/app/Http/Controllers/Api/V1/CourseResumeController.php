<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Course\Models\Course;
use App\Domains\Learning\Models\LessonProgress;
use App\Domains\Core\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * CourseResumeController
 *
 * Returns the user's best resume point and completed lessons for a given course:
 *   - The most recently updated incomplete lesson
 *   - Array of all completed lesson IDs for this course
 *   - Falls back to the first lesson of the first module
 *
 * GET /api/v1/courses/{course}/resume
 */
class CourseResumeController extends ApiController
{
    use ApiResponse;

    public function show(Course $course): JsonResponse
    {
        $user = auth()->user();

        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        // ── 1. Fetch all completed lesson IDs for this course ─────────────────
        $completedLessonIds = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('completed', true)
            ->whereHas('lesson', function ($q) use ($course) {
                $q->whereHas('module', function ($q2) use ($course) {
                    $q2->where('course_id', $course->id);
                });
            })
            ->pluck('lesson_id')
            ->map(fn ($id) => (int) $id)
            ->toArray();

        // ── 2. Find the most recently watched incomplete lesson in this course ──
        $progress = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('completed', false)
            ->where('watched_seconds', '>', 5)
            ->whereHas('lesson', function ($q) use ($course) {
                $q->whereHas('module', function ($q2) use ($course) {
                    $q2->where('course_id', $course->id);
                });
            })
            ->with(['lesson', 'lesson.module'])
            ->orderByDesc('updated_at')
            ->first();

        if ($progress && $progress->lesson) {
            return $this->success([
                'lesson_id'            => (int) $progress->lesson_id,
                'module_id'            => (int) $progress->lesson->module_id,
                'watched_seconds'      => (int) $progress->watched_seconds,
                'completed'            => false,
                'lesson_title'         => $progress->lesson->title,
                'module_title'         => optional($progress->lesson->module)->title,
                'completed_lesson_ids' => $completedLessonIds,
            ]);
        }

        // ── 3. Fallback: first lesson of first module ──────────────────────────
        $firstLesson = $course->modules()
            ->orderBy('order')
            ->with(['lessons' => fn ($q) => $q->orderBy('order')->limit(1)])
            ->get()
            ->flatMap(fn ($m) => $m->lessons)
            ->first();

        if (!$firstLesson) {
            return $this->success([
                'lesson_id'            => null,
                'completed_lesson_ids' => $completedLessonIds,
            ]);
        }

        return $this->success([
            'lesson_id'            => (int) $firstLesson->id,
            'module_id'            => (int) $firstLesson->module_id,
            'watched_seconds'      => 0,
            'completed'            => false,
            'lesson_title'         => $firstLesson->title,
            'module_title'         => null,
            'completed_lesson_ids' => $completedLessonIds,
        ]);
    }
}
