<?php

namespace App\Domains\LiveClass\Actions;

use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\LiveClass\Services\MeetingAdapterService;
use App\Domains\Core\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class ScheduleLiveClassAction
{
    protected MeetingAdapterService $meetingService;

    public function __construct(MeetingAdapterService $meetingService)
    {
        $this->meetingService = $meetingService;
    }

    /**
     * Schedule a new Live Class.
     */
    public function execute(array $data, array $batchIds = []): LiveClass
    {
        return DB::transaction(function () use ($data, $batchIds) {
            // Generate meeting links
            $meeting = $this->meetingService->generateMeeting($data['provider'], $data['title']);
            
            $payload = array_merge($data, $meeting, [
                'status' => 'scheduled'
            ]);

            $liveClass = LiveClass::create($payload);

            // Sync batch assignments
            if (!empty($batchIds)) {
                $liveClass->batches()->sync($batchIds);
            }

            ActivityLog::record(
                'live_class_scheduled',
                "Live class '{$liveClass->title}' scheduled for {$liveClass->scheduled_at}."
            );

            return $liveClass;
        });
    }
}
