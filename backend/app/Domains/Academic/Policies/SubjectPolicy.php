<?php

namespace App\Domains\Academic\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Academic\Models\Subject;
use Illuminate\Auth\Access\HandlesAuthorization;

class SubjectPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Subject $model)
    {
        return true;
    }

    public function create(User $user)
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Subject $model)
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Subject $model)
    {
        return $user->hasRole('admin');
    }
}

