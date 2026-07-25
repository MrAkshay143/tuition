<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\CourseModule;
use App\Domains\Core\Models\ActivityLog;

class UpdateModuleAction
{
    /**
     * Update an existing course module.
     */
    public function execute(CourseModule $module, array $data): CourseModule
    {
        $module->update($data);

        ActivityLog::record(
            'module_updated',
            "Module '{$module->title}' has been updated."
        );

        return $module;
    }
}
