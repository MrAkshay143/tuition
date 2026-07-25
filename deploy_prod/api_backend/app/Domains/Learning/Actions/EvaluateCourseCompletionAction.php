<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Learning\Models\CourseCompletion;
use App\Domains\Learning\Models\LessonProgress;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\Lesson;

class EvaluateCourseCompletionAction
{
    public function execute(User $user, int $courseId): CourseCompletion
    {
        $course = Course::findOrFail($courseId);
        
        // Get all lesson IDs in the course
        $lessonIds = Lesson::whereHas('module', function ($q) use ($courseId) {
            $q->where('course_id', $courseId);
        })->pluck('id');

        $totalLessonsCount = $lessonIds->count();
        $completedPercentage = 0;

        if ($totalLessonsCount > 0) {
            $completedLessonsCount = LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $lessonIds)
                ->where('completed', true)
                ->count();

            $completedPercentage = (int) round(($completedLessonsCount / $totalLessonsCount) * 100);
        }

        $completion = CourseCompletion::updateOrCreate(
            [
                'user_id'   => $user->id,
                'course_id' => $courseId,
            ],
            [
                'completed_percentage' => $completedPercentage,
                'completed_at'         => $completedPercentage === 100 ? now() : null,
            ]
        );

        // Auto-generate certificate metadata if 100% completed
        if ($completedPercentage === 100 && !$completion->certificate_generated) {
            (new GenerateCertificateEligibilityAction())->execute($user, $course);
            $completion->certificate_generated = true;
            $completion->certificate_id = 'CERT-' . strtoupper(bin2hex(random_bytes(6)));
            $completion->save();
        }

        return $completion;
    }
}
