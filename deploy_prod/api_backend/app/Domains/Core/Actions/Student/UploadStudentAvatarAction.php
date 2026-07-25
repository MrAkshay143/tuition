<?php

namespace App\Domains\Core\Actions\Student;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class UploadStudentAvatarAction
{
    public function execute(int $studentId, UploadedFile $file): User
    {
        $student = User::students()->findOrFail($studentId);
        
        // Delete old avatar
        if ($student->avatar && !str_starts_with($student->avatar, 'http')) {
            Storage::disk('public')->delete($student->avatar);
        }

        $path = $file->store("avatars/{$studentId}", 'public');
        $student->update(['avatar' => $path]);

        return $student->fresh();
    }
}
