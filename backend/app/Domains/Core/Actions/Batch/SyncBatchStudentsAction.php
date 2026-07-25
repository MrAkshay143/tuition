<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use App\Domains\Core\Models\ActivityLog;

class SyncBatchStudentsAction
{
    public function execute(int $batchId, array $studentIds): void
    {
        $batch = Batch::findOrFail($batchId);
        
        $batch->students()->syncWithoutDetaching($studentIds);
        ActivityLog::record('batch_students_updated', "Updated students in batch: {$batch->name}");
    }
}
