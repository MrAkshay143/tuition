<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Exam;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;

class StoreExamAction
{
    public function execute(array $data, int $teacherId)
    {
        return DB::transaction(function() use ($data, $teacherId) {
            $data["teacher_id"] = $teacherId;
            $batchIds = Arr::pull($data, 'batch_ids', []);
            $exam = Exam::create($data);
            if (!empty($batchIds)) {
                $exam->batches()->sync($batchIds);
            }
            return $exam->load("batches");
        });
    }
}
