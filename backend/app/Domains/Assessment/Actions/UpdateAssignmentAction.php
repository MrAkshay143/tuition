<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Assignment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;

class UpdateAssignmentAction {
    public function execute(Assignment $assignment, array $data) {
        return DB::transaction(function() use ($assignment, $data) {
            $mediaId = $data['media_id'] ?? null;
            $batchIds = Arr::pull($data, 'batch_ids');
            unset($data['media_id']);

            $assignment->update($data);
            if ($batchIds !== null) {
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
                    auth()->id() ?? 1
                );
            }
            
            return $assignment->load("batches");
        });
    }
}
