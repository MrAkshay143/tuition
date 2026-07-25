<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Lesson;
use App\Domains\Core\Models\ActivityLog;

class DeleteLessonAction
{
    /**
     * Delete a lesson.
     */
    public function execute(Lesson $lesson): bool
    {
        $title = $lesson->title;
        $deleted = $lesson->delete();

        if ($deleted) {
            ActivityLog::record(
                'lesson_deleted',
                "Lesson '{$title}' has been deleted."
            );
        }

        return $deleted;
    }
}
