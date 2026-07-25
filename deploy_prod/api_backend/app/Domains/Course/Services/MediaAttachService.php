<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Lesson;

class MediaAttachService
{
    public function attachToLesson(Lesson $lesson, int $mediaId): Lesson
    {
        $lesson->update(['media_id' => $mediaId]);
        return $lesson;
    }
}
