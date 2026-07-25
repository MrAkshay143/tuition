<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Assignment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;

class StoreAssignmentAction {
    public function execute(array $data, int $teacherId) {
        return DB::transaction(function() use ($data, $teacherId) {
            $data["teacher_id"] = $teacherId;
            $mediaId = $data['media_id'] ?? null;
            $batchIds = Arr::pull($data, 'batch_ids', []);
            unset($data['media_id']);

            $assignment = Assignment::create($data);
            if (!empty($batchIds)) {
                $assignment->batches()->sync($batchIds);
            }
            
            if ($mediaId) {
                app(\App\Domains\Media\Services\MediaLinkService::class)->link(
                    $mediaId,
                    Assignment::class,
                    $assignment->id,
                    'attachment',
                    1,
                    false,
                    $teacherId
                );
            }
            
            return $assignment->load("batches");
        });
    }
}
