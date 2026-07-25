<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\CourseModule;
use Illuminate\Support\Facades\DB;

class ReorderModulesAction
{
    /**
     * Reorder course modules.
     * $moduleIds is an array of IDs in the new order.
     */
    public function execute(array $moduleIds): void
    {
        DB::transaction(function () use ($moduleIds) {
            foreach ($moduleIds as $index => $id) {
                CourseModule::where('id', $id)->update(['sort_order' => $index]);
            }
        });
    }
}
