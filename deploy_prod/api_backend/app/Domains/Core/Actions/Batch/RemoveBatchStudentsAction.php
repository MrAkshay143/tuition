<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use App\Models\ActivityLog;

class RemoveBatchStudentsAction
{
    public function execute(int $batchId, array $studentIds): void
    {
        $batch = Batch::findOrFail($batchId);
        $batch->students()->detach($studentIds);
        ActivityLog::record('batch_students_removed', "Removed students from batch: {$batch->name}");
    }
}
