<?php

namespace App\Domains\Academic\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Academic\Models\EducationType;
use Illuminate\Auth\Access\HandlesAuthorization;

class EducationTypePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, EducationType $model)
    {
        return true;
    }

    public function create(User $user)
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, EducationType $model)
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, EducationType $model)
    {
        return $user->hasRole('admin');
    }
}

