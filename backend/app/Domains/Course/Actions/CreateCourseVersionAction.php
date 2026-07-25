<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseVersion;
use Illuminate\Support\Facades\DB;

class CreateCourseVersionAction
{
    public function execute(Course $course, int $userId, ?string $changeSummary = null): CourseVersion
    {
        return DB::transaction(function () use ($course, $userId, $changeSummary) {
            $course->load(['modules.lessons']);

            $snapshot = [
                'title'       => $course->title,
                'description' => $course->description,
                'thumbnail'   => $course->thumbnail,
                'status'      => $course->status,
                'modules'     => $course->modules->map(function ($module) {
                    return [
                        'title'      => $module->title,
                        'sort_order' => $module->sort_order,
                        'lessons'    => $module->lessons->map(function ($lesson) {
                            return [
                                'title'            => $lesson->title,
                                'type'             => $lesson->type,
                                'content'          => $lesson->content,
                                'duration_seconds' => $lesson->duration_seconds,
                                'is_free_preview'  => $lesson->is_free_preview,
                                'sort_order'       => $lesson->sort_order,
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
            ];

            $latestVersion = CourseVersion::where('course_id', $course->id)->max('version') ?? 0;
            $nextVersion = $latestVersion + 1;

            return CourseVersion::create([
                'course_id'      => $course->id,
                'version'        => $nextVersion,
                'snapshot'       => $snapshot,
                'change_summary' => $changeSummary ?: "Version {$nextVersion} snapshot",
                'created_by'     => $userId,
            ]);
        });
    }
}
