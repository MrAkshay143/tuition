<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseVersion;
use App\Domains\Course\Models\CourseModule;
use App\Domains\Course\Models\Lesson;
use Illuminate\Support\Facades\DB;

class RestoreCourseVersionAction
{
    public function execute(Course $course, CourseVersion $version): Course
    {
        return DB::transaction(function () use ($course, $version) {
            $snapshot = $version->snapshot;

            // 1. Restore Course Details
            $course->update([
                'title'       => $snapshot['title'] ?? $course->title,
                'description' => $snapshot['description'] ?? $course->description,
                'thumbnail'   => $snapshot['thumbnail'] ?? $course->thumbnail,
                'status'      => $snapshot['status'] ?? $course->status,
            ]);

            // 2. Clear Existing modules, chapters & lessons
            $chapterIds = \App\Domains\Course\Models\CourseChapter::whereIn('module_id', $course->modules()->pluck('id'))->pluck('id');
            Lesson::whereIn('chapter_id', $chapterIds)->delete();
            \App\Domains\Course\Models\CourseChapter::whereIn('module_id', $course->modules()->pluck('id'))->delete();
            $course->modules()->delete();

            // 3. Recreate from snapshot
            $modules = $snapshot['modules'] ?? [];
            foreach ($modules as $modData) {
                $module = CourseModule::create([
                    'course_id'  => $course->id,
                    'title'      => $modData['title'],
                    'sort_order' => $modData['sort_order'],
                ]);

                $chapter = \App\Domains\Course\Models\CourseChapter::create([
                    'module_id'  => $module->id,
                    'title'      => 'Chapter 1',
                    'sort_order' => 1,
                ]);

                $lessons = $modData['lessons'] ?? [];
                foreach ($lessons as $lesData) {
                    Lesson::create([
                        'chapter_id'       => $chapter->id,
                        'title'            => $lesData['title'],
                        'type'             => $lesData['type'] ?? 'video',
                        'content'          => $lesData['content'] ?? null,
                        'duration_seconds' => $lesData['duration_seconds'] ?? null,
                        'is_free_preview'  => $lesData['is_free_preview'] ?? false,
                        'sort_order'       => $lesData['sort_order'],
                    ]);
                }
            }

            return $course->load(['modules.chapters.lessons']);
        });
    }
}
