<?php

namespace App\Domains\Certificate\Policies;

use App\Domains\Core\Models\User;
use App\Models\Certificate;
use Illuminate\Auth\Access\HandlesAuthorization;

class CertificatePolicy
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

    public function view(User $user, Certificate $certificate): bool
    {
        if ($user->isTeacher()) {
            return $certificate->isOwnedBy($user);
        }

        return $certificate->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('certificate.generate');
    }

    public function update(User $user, Certificate $certificate): bool
    {
        return $user->hasPermissionTo('certificate.generate') && $certificate->isOwnedBy($user);
    }

    public function delete(User $user, Certificate $certificate): bool
    {
        return $user->hasPermissionTo('certificate.generate') && $certificate->isOwnedBy($user);
    }
}
