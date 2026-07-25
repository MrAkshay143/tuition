<?php

namespace App\Domains\Core\Actions\Student;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\DTOs\Student\AssignStudentBatchData;

class RemoveStudentBatchAction
{
    public function execute(AssignStudentBatchData $data): void
    {
        $student = User::students()->findOrFail($data->studentId);

        DB::transaction(function () use ($student, $data) {
            $student->batches()->detach($data->batchIds);
            
            ActivityLog::record('batch_removed', "Removed batch assignments for student: {$student->name}");
        });
    }
}
