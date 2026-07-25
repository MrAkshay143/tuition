<?php

namespace App\Domains\LiveClass\Actions;

use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\Core\Models\ActivityLog;

class CancelLiveClassAction
{
    /**
     * Cancel a scheduled live class.
     */
    public function execute(LiveClass $liveClass): LiveClass
    {
        $liveClass->update(['status' => 'cancelled']);

        ActivityLog::record(
            'live_class_cancelled',
            "Live class '{$liveClass->title}' has been cancelled."
        );

        return $liveClass;
    }
}
