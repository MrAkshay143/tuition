<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use App\Domains\Core\Models\User;
use App\Models\ActivityLog;

class UpdateBatchAction
{
    public function execute(User $actor, int $batchId, array $data): Batch
    {
        $batch = Batch::findOrFail($batchId);

        if (!$actor->isAdmin()) {
            unset($data['teacher_id']);
        }

        $batch->update($data);
        ActivityLog::record('updated', "Updated batch: {$batch->name}");

        return $batch->fresh();
    }
}

