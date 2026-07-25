<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseModule;
use App\Domains\Course\Models\Lesson;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\Models\ActivityLog;

class ImportCourseAction
{
    /**
     * Import a course configuration array snapshot.
     */
    public function execute(array $data, int $teacherId): Course
    {
        return DB::transaction(function () use ($data, $teacherId) {
            $course = Course::create([
                'title'       => $data['title'] ?? 'Imported Course',
                'description' => $data['description'] ?? null,
                'thumbnail'   => $data['thumbnail'] ?? null,
                'status'      => 'draft',
                'teacher_id'  => $teacherId,
            ]);

            $modulesData = $data['modules'] ?? [];
            foreach ($modulesData as $modVal) {
                $module = CourseModule::create([
                    'course_id'  => $course->id,
                    'title'      => $modVal['title'] ?? 'Untitled Module',
                    'sort_order' => $modVal['sort_order'] ?? 1,
                ]);

                // Create a default chapter to hold the imported lessons
                $chapter = \App\Domains\Course\Models\CourseChapter::create([
                    'module_id'  => $module->id,
                    'title'      => 'Chapter 1',
                    'sort_order' => 1,
                ]);

                $lessonsData = $modVal['lessons'] ?? [];
                foreach ($lessonsData as $lesVal) {
                    $lesson = Lesson::create([
                        'chapter_id'       => $chapter->id,
                        'title'            => $lesVal['title'] ?? 'Untitled Lesson',
                        'type'             => $lesVal['type'] ?? 'video',
                        'content'          => $lesVal['content'] ?? null,
                        'duration_seconds' => $lesVal['duration_seconds'] ?? null,
                        'is_free_preview'  => $lesVal['is_free_preview'] ?? false,
                        'sort_order'       => $lesVal['sort_order'] ?? 1,
                    ]);

                    $primaryMediaId = $lesVal['primary_media_id'] ?? null;
                    $downloadMediaId = $lesVal['download_media_id'] ?? null;

                    if ($primaryMediaId || $downloadMediaId) {
                        app(\App\Domains\Media\Services\MediaLinkService::class)->syncLessonLinks(
                            $lesson,
                            $primaryMediaId,
                            $downloadMediaId,
                            $teacherId
                        );
                    }
                }
            }

            ActivityLog::record(
                'course_imported',
                "Course '{$course->title}' imported from package."
            );

            return $course;
        });
    }
}
