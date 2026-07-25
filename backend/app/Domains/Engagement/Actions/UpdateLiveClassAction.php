<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Facades\DB;
class UpdateLiveClassAction {
    public function execute(LiveClass $liveClass, array $data): LiveClass {
        return DB::transaction(function() use ($liveClass, $data) {
            $batchIds = \Illuminate\Support\Arr::pull($data, 'batch_ids');
            $liveClass->update($data);
            if ($batchIds !== null) {
                $liveClass->batches()->sync($batchIds);
            }
            return $liveClass->load("batches");
        });
    }
}
