<?php

namespace App\Domains\Core\Actions\Student;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\DTOs\Student\AssignStudentBatchData;
use App\Domains\Core\Models\Batch;

class AssignStudentBatchAction
{
    public function execute(AssignStudentBatchData $data): void
    {
        $student = User::students()->findOrFail($data->studentId);

        DB::transaction(function () use ($student, $data) {
            $student->batches()->syncWithoutDetaching($data->batchIds);
            ActivityLog::record('batch_assigned', "Updated batch assignments for student: {$student->name}");
        });
    }
}
