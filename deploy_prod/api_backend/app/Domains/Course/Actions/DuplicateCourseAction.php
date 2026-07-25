<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseModule;
use App\Domains\Course\Models\Lesson;
use App\Domains\Core\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class DuplicateCourseAction
{
    /**
     * Duplicate a course along with its modules and lessons.
     */
    public function execute(Course $course): Course
    {
        return DB::transaction(function () use ($course) {
            // 1. Replicate Course base card
            $newCourse = $course->replicate();
            $newCourse->title = $course->title . ' (Copy)';
            $newCourse->status = 'draft'; // Duplicated courses start as draft
            $newCourse->save();

            // 2. Replicate all modules, chapters & lessons
            foreach ($course->modules as $module) {
                $newModule = $module->replicate();
                $newModule->course_id = $newCourse->id;
                $newModule->save();

                foreach ($module->chapters as $chapter) {
                    $newChapter = $chapter->replicate();
                    $newChapter->module_id = $newModule->id;
                    $newChapter->save();

                    foreach ($chapter->lessons as $lesson) {
                        $newLesson = $lesson->replicate();
                        $newLesson->chapter_id = $newChapter->id;
                        $newLesson->save();

                        // Copy all polymorphic media links
                        $mediaLinks = \App\Domains\Media\Models\MediaLink::where('entity_type', Lesson::class)
                            ->where('entity_id', $lesson->id)
                            ->get();

                        foreach ($mediaLinks as $link) {
                            $newLink = $link->replicate();
                            $newLink->entity_id = $newLesson->id;
                            $newLink->save();
                        }
                    }
                }
            }

            // 3. Duplicate batch attachments if any
            $newCourse->batches()->sync($course->batches()->pluck('batches.id')->toArray());

            ActivityLog::record(
                'course_duplicated',
                "Course '{$course->title}' was duplicated into '{$newCourse->title}'."
            );

            return $newCourse;
        });
    }
}
