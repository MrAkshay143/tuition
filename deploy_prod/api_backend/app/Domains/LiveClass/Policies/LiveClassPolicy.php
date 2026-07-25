<?php

namespace App\Domains\LiveClass\Policies;

use App\Domains\Core\Models\User;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Auth\Access\HandlesAuthorization;

class LiveClassPolicy
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

    public function view(User $user, LiveClass $liveClass): bool
    {
        if ($user->isTeacher()) {
            return $liveClass->isOwnedBy($user);
        }

        $classBatchIds = $liveClass->batches()->pluck('batches.id')->toArray();
        $studentBatchIds = $user->batches()->pluck('batches.id')->toArray();

        return !empty(array_intersect($classBatchIds, $studentBatchIds));
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('live_class.manage');
    }

    public function update(User $user, LiveClass $liveClass): bool
    {
        return $user->hasPermission('live_class.manage') && $liveClass->isOwnedBy($user);
    }

    public function delete(User $user, LiveClass $liveClass): bool
    {
        return $user->hasPermission('live_class.manage') && $liveClass->isOwnedBy($user);
    }
}
