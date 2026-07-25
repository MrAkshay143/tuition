<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Lesson;
use App\Domains\Learning\Services\LearningProgressService;
use App\Domains\Learning\Models\LessonProgress;

class CompleteLessonAction
{
    public function __construct(
        protected LearningProgressService $progressService
    ) {}

    public function execute(User $user, int $lessonId): LessonProgress
    {
        $lesson = Lesson::findOrFail($lessonId);
        return $this->progressService->markCompleted($user, $lesson);
    }
}
