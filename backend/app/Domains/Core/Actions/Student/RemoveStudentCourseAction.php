<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\DTOs\Student\AssignStudentCourseData;
use App\Domains\Learning\Models\Enrollment;

class RemoveStudentCourseAction
{
    public function execute(AssignStudentCourseData $data): void
    {
        $student = User::students()->findOrFail($data->studentId);

        DB::transaction(function () use ($student, $data) {
            Enrollment::where('user_id', $student->id)
                ->whereIn('course_id', $data->courseIds)
                ->delete();

            ActivityLog::record('course_removed', "Removed courses from student: {$student->name}");
        });
    }
}

