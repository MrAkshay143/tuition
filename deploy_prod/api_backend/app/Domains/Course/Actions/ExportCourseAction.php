<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;

class ExportCourseAction
{
    /**
     * Export course data structure as an array snapshot.
     */
    public function execute(Course $course): array
    {
        return [
            'schema_version' => '1.0.0',
            'title'          => $course->title,
            'description'    => $course->description,
            'thumbnail'      => $course->thumbnail,
            'status'         => 'draft', // Reset to draft on import
            'modules'        => $course->modules()->orderBy('sort_order')->get()->map(function ($module) {
                return [
                    'title'      => $module->title,
                    'sort_order' => $module->sort_order,
                    'lessons'    => $module->lessons()->orderBy('sort_order')->get()->map(function ($lesson) {
                        return [
                            'title'            => $lesson->title,
                            'type'             => $lesson->type,
                            'content'          => $lesson->content,
                            'duration_seconds' => $lesson->duration_seconds,
                            'is_free_preview'  => $lesson->is_free_preview,
                            'sort_order'       => $lesson->sort_order,
                        ];
                    })->toArray()
                ];
            })->toArray()
        ];
    }
}
