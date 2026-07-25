<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Lesson;
use App\Domains\Learning\Models\LessonProgress;
use App\Domains\Learning\Services\LearningProgressService;

class UpdateProgressAction
{
    public function __construct(
        protected LearningProgressService $progressService
    ) {}

    public function execute(User $user, int $lessonId, array $data): LessonProgress
    {
        $lesson = Lesson::findOrFail($lessonId);

        $watchSeconds = $data['watch_seconds'] ?? $data['watched_seconds'] ?? 0;
        $position = $data['position'] ?? 0;

        return $this->progressService->updateProgress($user, $lesson, [
            'watch_seconds' => $watchSeconds,
            'position'      => $position,
            'speed'         => $data['speed'] ?? 1.00,
            'device_id'     => $data['device_id'] ?? 'default',
            'completed'     => (bool) ($data['completed'] ?? false),
        ]);
    }
}
