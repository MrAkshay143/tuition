<?php

namespace App\Domains\Media\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Media\Models\Media;
use Illuminate\Auth\Access\HandlesAuthorization;

class MediaPolicy
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

    public function view(User $user, Media $media): bool
    {
        if ($user->isTeacher()) {
            return $media->isOwnedBy($user);
        }

        return $media->visibility === 'public';
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('media.upload');
    }

    public function update(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.upload') && $media->isOwnedBy($user);
    }

    public function delete(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.delete') && $media->isOwnedBy($user);
    }

    public function restore(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.upload') && $media->isOwnedBy($user);
    }

    public function forceDelete(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.delete') && $media->isOwnedBy($user);
    }
}
