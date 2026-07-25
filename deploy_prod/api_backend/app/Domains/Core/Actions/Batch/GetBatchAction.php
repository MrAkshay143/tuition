<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use App\Support\Query\IncludeParser;

class GetBatchAction
{
    public function execute(int $batchId, ?string $includes): Batch
    {
        $query = Batch::query();

        if ($includes) {
            IncludeParser::apply($query, $includes, ['students', 'courses', 'teacher']);
        } else {
            $query->with(['students:id,name,email,avatar', 'courses:id,title,thumbnail']);
        }

        return $query->findOrFail($batchId);
    }
}
