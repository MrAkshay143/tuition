<?php

namespace App\Domains\Learning\Services;

use App\Domains\Core\Models\User;
use App\Domains\Learning\Models\StudentBookmark;

class BookmarkService
{
    public function addBookmark(User $user, int $lessonId, ?int $timestamp, ?string $note)
    {
        return StudentBookmark::updateOrCreate(
            [
                'user_id'   => $user->id,
                'lesson_id' => $lessonId,
            ],
            [
                'video_timestamp_seconds' => $timestamp,
                'note'                    => $note,
            ]
        );
    }

    public function removeBookmark(User $user, int $lessonId): bool
    {
        $bookmark = StudentBookmark::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->first();

        if ($bookmark) {
            return $bookmark->delete();
        }

        return false;
    }
}
