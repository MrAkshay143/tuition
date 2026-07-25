<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Lesson;
use App\Domains\Course\Models\LessonVersion;
use Illuminate\Support\Facades\DB;

class AutoSaveLessonAction
{
    /**
     * Auto-save lesson content and generate version checkpoint if modified.
     */
    public function execute(Lesson $lesson, array $data, int $userId): Lesson
    {
        return DB::transaction(function () use ($lesson, $data, $userId) {
            // Check if title or content is changing
            $hasChanges = false;
            foreach (['title', 'content'] as $field) {
                if (isset($data[$field]) && $lesson->{$field} !== $data[$field]) {
                    $hasChanges = true;
                    break;
                }
            }

            if ($hasChanges) {
                // Get next version number
                $nextVer = ($lesson->versions()->max('version') ?? 0) + 1;

                // Create history rollback checkpoint
                LessonVersion::create([
                    'lesson_id'       => $lesson->id,
                    'updated_by'      => $userId,
                    'title'           => $lesson->title,
                    'content'         => $lesson->content,
                    'version'         => $nextVer,
                ]);
            }

            // Perform auto-save update
            $lesson->update($data);

            return $lesson;
        });
    }
}
