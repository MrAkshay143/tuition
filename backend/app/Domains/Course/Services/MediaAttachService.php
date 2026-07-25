<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Lesson;
use App\Domains\Media\Services\MediaLinkService;

/**
 * Wraps MediaLinkService for lesson-specific media attachment convenience.
 * All media is stored via the polymorphic media_links table, not as
 * direct foreign keys on the lessons table.
 */
class MediaAttachService
{
    public function __construct(protected MediaLinkService $mediaLinkService) {}

    /**
     * Attach a primary media item to a lesson (replaces any existing primary link).
     */
    public function attachToLesson(Lesson $lesson, int $mediaId, int $userId = 1): Lesson
    {
        $this->mediaLinkService->syncLessonLinks($lesson, $mediaId, null, $userId);
        return $lesson->fresh();
    }

    /**
     * Sync both primary and download media for a lesson.
     */
    public function syncLessonMedia(Lesson $lesson, ?int $primaryId, ?int $downloadId, int $userId = 1): Lesson
    {
        $this->mediaLinkService->syncLessonLinks($lesson, $primaryId, $downloadId, $userId);
        return $lesson->fresh();
    }
}
