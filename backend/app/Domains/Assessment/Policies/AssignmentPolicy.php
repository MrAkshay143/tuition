<?php

namespace App\Domains\Assessment\Policies;

use App\Domains\Core\Models\User;
use App\Models\Assignment;
use Illuminate\Auth\Access\HandlesAuthorization;

class AssignmentPolicy
{
    use HandlesAuthorization;

    public function before(User $user, $ability)
    {
        if ($user->isAdmin() || $user->isTeacher()) {
            return true;
        }
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Assignment $assignment): bool
    {
        if ($user->isTeacher()) {
            return $assignment->isOwnedBy($user);
        }

        return $assignment->batches()->whereHas('students', fn($q) => $q->where('users.id', $user->id))->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('assignment.manage');
    }

    public function update(User $user, Assignment $assignment): bool
    {
        return $user->hasPermissionTo('assignment.manage') && $assignment->isOwnedBy($user);
    }

    public function delete(User $user, Assignment $assignment): bool
    {
        return $user->hasPermissionTo('assignment.manage') && $assignment->isOwnedBy($user);
    }
}
