<?php

namespace App\Domains\Assessment\Policies;

use App\Domains\Core\Models\User;
use App\Models\Exam;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExamPolicy
{
    use HandlesAuthorization;

    public function before(User $user, $ability)
    {
        if ($user->isAdmin()) {
            return true;
        }
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Exam $exam): bool
    {
        if ($user->isTeacher()) {
            return $exam->isOwnedBy($user);
        }

        return $exam->batches()->whereHas('students', fn($q) => $q->where('users.id', $user->id))->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('exam.manage');
    }

    public function update(User $user, Exam $exam): bool
    {
        return $user->hasPermission('exam.manage') && $exam->isOwnedBy($user);
    }

    public function delete(User $user, Exam $exam): bool
    {
        return $user->hasPermission('exam.manage') && $exam->isOwnedBy($user);
    }
}
