<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Lesson;
use App\Domains\Core\Models\ActivityLog;

class CreateLessonAction
{
    /**
     * Create a new lesson.
     */
    public function execute(array $data): Lesson
    {
        if (!isset($data['sort_order'])) {
            $maxOrder = Lesson::where('chapter_id', $data['chapter_id'])->max('sort_order') ?? -1;
            $data['sort_order'] = $maxOrder + 1;
        }

        $lesson = Lesson::create($data);

        ActivityLog::record(
            'lesson_created',
            "Lesson '{$lesson->title}' has been created inside chapter ID {$lesson->chapter_id}."
        );

        return $lesson;
    }
}
