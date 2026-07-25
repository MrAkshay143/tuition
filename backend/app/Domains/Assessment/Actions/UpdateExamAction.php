<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Exam;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;

class UpdateExamAction
{
    public function execute(Exam $exam, array $data)
    {
        return DB::transaction(function() use ($exam, $data) {
            $batchIds = Arr::pull($data, 'batch_ids');
            $exam->update($data);
            if ($batchIds !== null) {
                $exam->batches()->sync($batchIds);
            }
            return $exam->load("batches");
        });
    }
}
