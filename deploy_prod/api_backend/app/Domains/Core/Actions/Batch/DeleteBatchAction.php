<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use App\Models\ActivityLog;
use App\Exceptions\DomainException;

class DeleteBatchAction
{
    public function execute(int $batchId): void
    {
        $batch = Batch::findOrFail($batchId);

        if ($batch->students()->count() > 0) {
            throw new DomainException('Cannot delete batch with active students. Unassign students first.', 422, ['students' => 'Batch contains active students']);
        }

        $name = $batch->name;
        $batch->delete();
        ActivityLog::record('deleted', "Deleted batch: {$name}");
    }
}
