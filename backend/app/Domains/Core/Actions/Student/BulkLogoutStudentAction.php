<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class BulkLogoutStudentAction
{
    public function execute(array $studentIds): array
    {
        $processed = 0;
        $successful = 0;
        $failed = 0;
        $errors = [];

        DB::transaction(function () use ($studentIds, &$processed, &$successful, &$failed, &$errors) {
            $students = User::students()->whereIn('id', $studentIds)->get();
            foreach ($studentIds as $sId) {
                $processed++;
                $student = $students->firstWhere('id', $sId);
                
                if (!$student) {
                    $failed++;
                    $errors[] = ['student_id' => $sId, 'reason' => 'Student not found'];
                    continue;
                }

                $student->incrementSessionVersion();
                ActivityLog::record('force_logout', "Forced logout on all devices via bulk action for student: {$student->name}");
                $successful++;
            }
        });

        return [
            'processed' => $processed,
            'successful' => $successful,
            'failed' => $failed,
            'errors' => $errors
        ];
    }
}

