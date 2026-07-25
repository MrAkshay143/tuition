<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Facades\DB;
class StoreLiveClassAction {
    public function execute(array $data, int $teacherId): LiveClass {
        return DB::transaction(function() use ($data, $teacherId) {
            $batchIds = \Illuminate\Support\Arr::pull($data, 'batch_ids', []);
            $data["teacher_id"] = $teacherId;
            $data["status"] = "scheduled";
            $liveClass = LiveClass::create($data);
            if (!empty($batchIds)) {
                $liveClass->batches()->sync($batchIds);
            }
            return $liveClass->load("batches");
        });
    }
}
