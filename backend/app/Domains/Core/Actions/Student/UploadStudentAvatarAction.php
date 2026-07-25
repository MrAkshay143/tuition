<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use Illuminate\Http\UploadedFile;

class UploadStudentAvatarAction
{
    public function execute(int $studentId, UploadedFile $file): User
    {
        $student = User::students()->findOrFail($studentId);
        $providerInstance = \App\Domains\Core\Providers\MediaProviderFactory::make('local');
        
        // Delete old avatar
        if ($student->avatar && !str_starts_with($student->avatar, 'http')) {
            $providerInstance->delete($student->avatar);
        }

        $result = $providerInstance->upload($file, "avatars/{$studentId}");
        $student->update(['avatar' => $result['path']]);

        return $student->fresh();
    }
}

