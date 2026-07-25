<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Learning\Models\LessonProgress;
use App\Domains\Learning\Models\LearningHistory;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Lesson;

class MarkLessonCompletedAction
{
    public function execute(User $user, Lesson $lesson): LessonProgress
    {
        $progress = LessonProgress::firstOrCreate([
            'user_id'   => $user->id,
            'lesson_id' => $lesson->id,
        ]);

        if (!$progress->completed) {
            $progress->completed = true;
            $progress->completed_at = now();
            $progress->save();

            // Log history
            LearningHistory::create([
                'user_id'        => $user->id,
                'course_id'      => $lesson->module?->course_id,
                'lesson_id'      => $lesson->id,
                'action'         => 'lesson_completed',
                'watch_seconds'  => $progress->watched_seconds ?: 0,
                'playback_speed' => 1.00,
            ]);

            // Re-evaluate course completion
            if ($lesson->module?->course_id) {
                (new EvaluateCourseCompletionAction())->execute($user, $lesson->module->course_id);
            }
        }

        return $progress;
    }
}
