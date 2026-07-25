<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetBatchStudentsAction
{
    public function execute(int $batchId): LengthAwarePaginator
    {
        $batch = Batch::findOrFail($batchId);
        return $batch->students()->paginate(20);
    }
}
