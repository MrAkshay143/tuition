<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\Core\Providers\MeetingProviderFactory;
use Illuminate\Support\Facades\DB;

class StoreLiveClassAction {
    public function execute(array $data, int $teacherId): LiveClass {
        return DB::transaction(function() use ($data, $teacherId) {
            $batchIds = \Illuminate\Support\Arr::pull($data, 'batch_ids', []);
            $data["teacher_id"] = $teacherId;
            $data["status"] = "scheduled";

            // If the meeting URL is not provided manually, generate one using the provider
            if (empty($data['meeting_url'])) {
                $providerInstance = MeetingProviderFactory::make($data['provider'] ?? 'zoom');
                $meetingData = $providerInstance->createMeeting($data);
                $data = array_merge($data, $meetingData);
            }

            $liveClass = LiveClass::create($data);
            if (!empty($batchIds)) {
                $liveClass->batches()->sync($batchIds);
            }
            return $liveClass->load("batches");
        });
    }
}
