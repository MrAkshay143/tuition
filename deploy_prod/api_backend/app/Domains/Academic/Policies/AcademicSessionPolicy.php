<?php

namespace App\Domains\Academic\Policies;

use App\Models\User;
use App\Domains\Academic\Models\AcademicSession;
use Illuminate\Auth\Access\HandlesAuthorization;

class AcademicSessionPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, AcademicSession $model)
    {
        return true;
    }

    public function create(User $user)
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, AcademicSession $model)
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, AcademicSession $model)
    {
        return $user->hasRole('admin');
    }
}
