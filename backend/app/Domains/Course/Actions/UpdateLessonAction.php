<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Lesson;
use App\Domains\Core\Models\ActivityLog;

class UpdateLessonAction
{
    protected AutoSaveLessonAction $autoSaveAction;

    public function __construct(AutoSaveLessonAction $autoSaveAction)
    {
        $this->autoSaveAction = $autoSaveAction;
    }

    /**
     * Update an existing lesson, logging history.
     */
    public function execute(Lesson $lesson, array $data, int $userId): Lesson
    {
        $lesson = $this->autoSaveAction->execute($lesson, $data, $userId);

        ActivityLog::record(
            'lesson_updated',
            "Lesson '{$lesson->title}' has been updated."
        );

        return $lesson;
    }
}
