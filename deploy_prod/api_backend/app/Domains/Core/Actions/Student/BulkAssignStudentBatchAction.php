<?php

namespace App\Domains\Core\Actions\Student;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\Models\Batch;

class BulkAssignStudentBatchAction
{
    public function execute(array $studentIds, array $batchIds): array
    {
        $processed = 0;
        $successful = 0;
        $failed = 0;
        $errors = [];

        DB::transaction(function () use ($studentIds, $batchIds, &$processed, &$successful, &$failed, &$errors) {
            $students = User::students()->whereIn('id', $studentIds)->get();
            foreach ($studentIds as $sId) {
                $processed++;
                $student = $students->firstWhere('id', $sId);
                
                if (!$student) {
                    $failed++;
                    $errors[] = ['student_id' => $sId, 'reason' => 'Student not found'];
                    continue;
                }

                $student->batches()->syncWithoutDetaching($batchIds);
                ActivityLog::record('batch_assigned', "Assigned batches via bulk action for student: {$student->name}");
                $successful++;
            }
        });

        return [
            'processed'  => $processed,
            'successful' => $successful,
            'failed'     => $failed,
            'errors'     => $errors
        ];
    }
}
