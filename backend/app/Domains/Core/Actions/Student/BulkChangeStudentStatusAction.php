<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class BulkChangeStudentStatusAction
{
    public function execute(array $studentIds, bool $active, string $actionName): array
    {
        $processed = 0;
        $successful = 0;
        $failed = 0;
        $errors = [];

        DB::transaction(function () use ($studentIds, $active, $actionName, &$processed, &$successful, &$failed, &$errors) {
            $students = User::students()->whereIn('id', $studentIds)->get();
            foreach ($studentIds as $sId) {
                $processed++;
                $student = $students->firstWhere('id', $sId);
                
                if (!$student) {
                    $failed++;
                    $errors[] = ['student_id' => $sId, 'reason' => 'Student not found'];
                    continue;
                }

                if ($student->active === $active) {
                    $failed++;
                    $errors[] = ['student_id' => $sId, 'reason' => $active ? 'Already active' : 'Already suspended'];
                    continue;
                }

                $student->update(['active' => $active]);
                ActivityLog::record($actionName, ucfirst($actionName) . " student via bulk action: {$student->name}");
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

