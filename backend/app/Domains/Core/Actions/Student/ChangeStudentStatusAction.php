<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;

class ChangeStudentStatusAction
{
    /**
     * Execute the action.
     */
    public function execute(int $studentId, bool $active, string $actionName): User
    {
        $student = User::students()->findOrFail($studentId);
        
        $student->update(['active' => $active]);
        
        ActivityLog::record($actionName, ucfirst($actionName) . " student account: {$student->name}");

        return $student;
    }
}

