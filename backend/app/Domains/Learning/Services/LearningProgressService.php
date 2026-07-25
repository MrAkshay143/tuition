<?php

namespace App\Domains\Learning\Services;

use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Lesson;
use App\Domains\Learning\Actions\UpdateLessonProgressAction;
use App\Domains\Learning\Actions\MarkLessonCompletedAction;

class LearningProgressService
{
    protected $updateAction;
    protected $completeAction;

    public function __construct(
        UpdateLessonProgressAction $updateAction,
        MarkLessonCompletedAction $completeAction
    ) {
        $this->updateAction = $updateAction;
        $this->completeAction = $completeAction;
    }

    public function updateProgress(User $user, Lesson $lesson, array $data)
    {
        return $this->updateAction->execute($user, $lesson, $data);
    }

    public function markCompleted(User $user, Lesson $lesson)
    {
        return $this->completeAction->execute($user, $lesson);
    }
}
