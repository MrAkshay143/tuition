<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\CourseModule;
use App\Domains\Core\Models\ActivityLog;

class CreateModuleAction
{
    /**
     * Create a new course module.
     */
    public function execute(array $data): CourseModule
    {
        // Get maximum sort order for this course if not provided
        if (!isset($data['sort_order'])) {
            $maxOrder = CourseModule::where('course_id', $data['course_id'])->max('sort_order') ?? -1;
            $data['sort_order'] = $maxOrder + 1;
        }

        $module = CourseModule::create($data);

        ActivityLog::record(
            'module_created',
            "Module '{$module->title}' has been created inside course ID {$module->course_id}."
        );

        return $module;
    }
}
