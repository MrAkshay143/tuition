<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Learning\Models\LessonProgress;
use App\Domains\Learning\Models\LearningSession;
use App\Domains\Learning\Models\LearningHistory;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Lesson;

class UpdateLessonProgressAction
{
    public function execute(User $user, Lesson $lesson, array $data): LessonProgress
    {
        $watchSeconds = $data['watch_seconds'] ?? 0;
        $position = $data['position'] ?? 0;
        $speed = $data['speed'] ?? 1.00;
        $deviceId = $data['device_id'] ?? 'default';

        // 1. Load or create lesson progress
        $progress = LessonProgress::firstOrCreate([
            'user_id'   => $user->id,
            'lesson_id' => $lesson->id,
        ]);

        // IDEMPOTENCY: only move progress forward
        if ($watchSeconds > $progress->watched_seconds) {
            $progress->watched_seconds = $watchSeconds;
        }

        // Auto-complete check at 95% or if client sends completed flag
        $isComplete = (bool) ($data['completed'] ?? false);
        if ($lesson->duration_seconds > 0) {
            $pct = ($progress->watched_seconds / $lesson->duration_seconds) * 100;
            if ($pct >= 95) {
                $isComplete = true;
            }
        }

        if ($isComplete && !$progress->completed) {
            $progress->completed = true;
            $progress->completed_at = now();

            // Log history
            LearningHistory::create([
                'user_id'        => $user->id,
                'course_id'      => $lesson->module?->course_id,
                'lesson_id'      => $lesson->id,
                'action'         => 'lesson_completed',
                'watch_seconds'  => $progress->watched_seconds,
                'playback_speed' => $speed,
                'device'         => $deviceId,
            ]);
        }

        $progress->save();

        // 2. Update learning session (latest offset)
        LearningSession::updateOrCreate(
            [
                'user_id'   => $user->id,
                'lesson_id' => $lesson->id,
                'device_id' => $deviceId,
            ],
            [
                'watch_seconds'  => $progress->watched_seconds,
                'last_position'  => $position,
                'playback_speed' => $speed,
            ]
        );

        // Re-evaluate course completion
        if ($lesson->module?->course_id) {
            (new EvaluateCourseCompletionAction())->execute($user, $lesson->module->course_id);
        }

        return $progress;
    }
}
