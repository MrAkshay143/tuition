<?php

namespace App\Domains\Core\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Core\Models\Batch;
use Illuminate\Auth\Access\HandlesAuthorization;

class BatchPolicy
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

    public function view(User $user, Batch $batch): bool
    {
        if ($user->isTeacher()) {
            return $batch->isOwnedBy($user);
        }

        return $batch->students()->where('users.id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('batch.manage');
    }

    public function update(User $user, Batch $batch): bool
    {
        return $user->hasPermission('batch.manage') && $batch->isOwnedBy($user);
    }

    public function delete(User $user, Batch $batch): bool
    {
        return $user->hasPermission('batch.manage') && $batch->isOwnedBy($user);
    }
}
