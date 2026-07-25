<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\ActivityLog;

class ResetStudentPasswordAction
{
    public function execute(int $studentId, string $newPassword): void
    {
        $student = User::students()->findOrFail($studentId);
        
        $student->update(['password' => Hash::make($newPassword)]);
        $student->tokens()->delete();
        $student->incrementSessionVersion();
        
        ActivityLog::record('password_reset', "Reset password for student: {$student->name}");
    }
}

