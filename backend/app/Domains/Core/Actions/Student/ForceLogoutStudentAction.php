<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;

class ForceLogoutStudentAction
{
    /**
     * Execute the action.
     */
    public function execute(int $studentId): void
    {
        $student = User::students()->findOrFail($studentId);
        
        $student->incrementSessionVersion();
        
        ActivityLog::record('force_logout', "Forced logout on all devices for student: {$student->name}");
    }
}

