<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\DTOs\Student\AssignStudentCourseData;
use App\Domains\Learning\Models\Enrollment;

class AssignStudentCourseAction
{
    public function execute(AssignStudentCourseData $data): void
    {
        $student = User::students()->findOrFail($data->studentId);

        DB::transaction(function () use ($student, $data) {
            foreach ($data->courseIds as $cId) {
                Enrollment::firstOrCreate([
                    'user_id' => $student->id,
                    'course_id' => $cId,
                ], [
                    'enrolled_at' => now(),
                ]);
            }
            ActivityLog::record('course_assigned', "Assigned courses to student: {$student->name}");
        });
    }
}

