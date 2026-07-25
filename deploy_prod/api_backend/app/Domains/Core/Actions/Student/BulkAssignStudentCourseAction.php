<?php

namespace App\Domains\Core\Actions\Student;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use App\Domains\Learning\Models\Enrollment;

class BulkAssignStudentCourseAction
{
    public function execute(array $studentIds, array $courseIds): array
    {
        $processed = 0;
        $successful = 0;
        $failed = 0;
        $errors = [];

        DB::transaction(function () use ($studentIds, $courseIds, &$processed, &$successful, &$failed, &$errors) {
            $students = User::students()->whereIn('id', $studentIds)->get();
            foreach ($studentIds as $sId) {
                $processed++;
                $student = $students->firstWhere('id', $sId);
                
                if (!$student) {
                    $failed++;
                    $errors[] = ['student_id' => $sId, 'reason' => 'Student not found'];
                    continue;
                }

                foreach ($courseIds as $cId) {
                    Enrollment::firstOrCreate([
                        'user_id' => $student->id,
                        'course_id' => $cId,
                    ], [
                        'enrolled_at' => now(),
                    ]);
                }
                
                ActivityLog::record('course_assigned', "Assigned courses via bulk action to student: {$student->name}");
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
