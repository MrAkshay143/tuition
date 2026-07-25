<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;

class DeleteStudentAction
{
    /**
     * Execute the action.
     */
    public function execute(int $studentId): void
    {
        $student = User::students()->findOrFail($studentId);
        $name = $student->name;
        $student->delete();

        ActivityLog::record('deleted', "Deleted student: $name");
    }
}

