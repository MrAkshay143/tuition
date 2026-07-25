<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Enums\CourseStatus;
use App\Domains\Core\Models\ActivityLog;
use App\Domains\Core\Services\EventBus;

class PublishCourseAction
{
    /**
     * Publish or unpublish a course.
     */
    public function execute(Course $course, bool $publish = true): Course
    {
        if ($publish) {
            $errors = [];
            if (empty($course->description)) {
                $errors['description'] = 'Course description is required for publishing.';
            }
            if (empty($course->thumbnail)) {
                $errors['thumbnail'] = 'Course thumbnail image is required for publishing.';
            }
            if ($course->modules()->count() === 0) {
                $errors['modules'] = 'Course must contain at least one module chapter.';
            }
            
            $hasLesson = false;
            foreach ($course->modules as $module) {
                if ($module->lessons()->count() > 0) {
                    $hasLesson = true;
                    break;
                }
            }
            if (!$hasLesson) {
                $errors['lessons'] = 'Course must contain at least one lesson syllabus item.';
            }

            if (!empty($errors)) {
                throw \Illuminate\Validation\ValidationException::withMessages($errors);
            }
        }

        $status = $publish ? CourseStatus::PUBLISHED : CourseStatus::DRAFT;
        $course->update(['status' => $status->value]);

        // Audit Logs
        \App\Domains\Course\Models\CourseActivityLog::create([
            'course_id'   => $course->id,
            'user_id'     => auth()->id() ?? $course->teacher_id,
            'event'       => $publish ? 'published' : 'unpublished',
            'description' => "Course was " . ($publish ? "published" : "unpublished") . " by " . (auth()->user()->name ?? 'System'),
        ]);

        $latestVersion = $course->versions()->first();
        if ($publish && $latestVersion) {
            \App\Domains\Course\Models\CoursePublishHistory::create([
                'course_id'         => $course->id,
                'user_id'           => auth()->id() ?? $course->teacher_id,
                'version'           => $latestVersion->version,
                'course_version_id' => $latestVersion->id,
                'published_at'      => now(),
            ]);
        }

        ActivityLog::record(
            $publish ? 'course_published' : 'course_unpublished',
            "Course '{$course->title}' status set to {$status->value}."
        );

        return $course;
    }
}
