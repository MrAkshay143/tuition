<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;

class ViewStudentDevicesRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) return false;
        $studentId = (int) $this->route('id');
        if ($user->role === 'student') {
            return (int) $user->id === $studentId;
        }
        return $user->isTeacher() || $user->isAdmin();
    }

    public function rules(): array
    {
        return [];
    }

    public function studentId(): int
    {
        return (int) $this->route('id');
    }
}
