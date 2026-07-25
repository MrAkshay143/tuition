<?php

namespace App\Domains\Core\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class StudentPolicy
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
        return $user->isAdmin() || $user->isTeacher();
    }

    public function view(User $user, User $student): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher()) {
            return $student->batches()->where('teacher_id', $user->id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function update(User $user, User $student): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher()) {
            return $student->batches()->where('teacher_id', $user->id)->exists();
        }

        return false;
    }

    public function delete(User $user, User $student): bool
    {
        return $user->isAdmin();
    }

    public function forceLogout(User $user, ?User $student = null): bool
    {
        return $user->isAdmin();
    }

    public function lock(User $user, ?User $student = null): bool
    {
        return $user->isAdmin();
    }

    public function unlock(User $user, ?User $student = null): bool
    {
        return $user->isAdmin();
    }

    public function suspend(User $user, ?User $student = null): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function activate(User $user, ?User $student = null): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function assignCourse(User $user, ?User $student = null): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function removeCourse(User $user, ?User $student = null): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function assignBatch(User $user, ?User $student = null): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function removeBatch(User $user, ?User $student = null): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    public function resetPassword(User $user, User $student): bool
    {
        return $user->isAdmin();
    }

    public function sendNotification(User $user, User $student): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }
}
