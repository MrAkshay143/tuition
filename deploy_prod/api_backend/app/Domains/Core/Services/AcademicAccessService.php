<?php

namespace App\Domains\Core\Services;

use App\Domains\Core\Models\User;
use Illuminate\Database\Eloquent\Model;

class AcademicAccessService
{
    public function canManage(User $user, Model $resource): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if (!$user->hasPermission('course.update') && !$user->hasPermission('batch.manage')) {
            return false;
        }

        if (method_exists($resource, 'isOwnedBy')) {
            return $resource->isOwnedBy($user);
        }

        return false;
    }

    public function canPublish(User $user, Model $resource): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if (!$user->hasPermission('course.publish')) {
            return false;
        }

        if (method_exists($resource, 'isOwnedBy')) {
            return $resource->isOwnedBy($user);
        }

        return false;
    }

    public function canArchive(User $user, Model $resource): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if (!$user->hasPermission('course.archive')) {
            return false;
        }

        if (method_exists($resource, 'isOwnedBy')) {
            return $resource->isOwnedBy($user);
        }

        return false;
    }

    public function canTransferOwnership(User $user): bool
    {
        return $user->isAdmin();
    }
}
