<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\CourseModule;
use App\Domains\Core\Models\ActivityLog;

class DeleteModuleAction
{
    /**
     * Delete a course module.
     */
    public function execute(CourseModule $module): bool
    {
        $title = $module->title;
        $deleted = $module->delete();

        if ($deleted) {
            ActivityLog::record(
                'module_deleted',
                "Module '{$title}' has been deleted."
            );
        }

        return $deleted;
    }
}
