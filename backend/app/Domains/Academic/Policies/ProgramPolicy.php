<?php

namespace App\Domains\Academic\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Academic\Models\Program;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProgramPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Program $model)
    {
        return true;
    }

    public function create(User $user)
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Program $model)
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Program $model)
    {
        return $user->hasRole('admin');
    }
}

