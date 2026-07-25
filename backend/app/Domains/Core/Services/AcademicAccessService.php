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

        if (!$user->hasPermissionTo('course.update') && !$user->hasPermissionTo('batch.manage')) {
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

        if (!$user->hasPermissionTo('course.publish')) {
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

        if (!$user->hasPermissionTo('course.archive')) {
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

    public function hasAccessToCourse(User $user, int $courseId): bool
    {
        if ($user->isAdmin() || $user->isTeacher()) {
            return true;
        }

        $isEnrolled = \Illuminate\Support\Facades\DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->exists();

        if (!$isEnrolled) {
            $isEnrolled = \Illuminate\Support\Facades\DB::table('batch_student')
                ->join('batch_course', 'batch_student.batch_id', '=', 'batch_course.batch_id')
                ->where('batch_student.student_id', $user->id)
                ->where('batch_course.course_id', $courseId)
                ->exists();
        }

        return $isEnrolled;
    }

    public function hasAccessToLiveClass(User $user, \App\Domains\LiveClass\Models\LiveClass $liveClass): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher() && $liveClass->teacher_id === $user->id) {
            return true;
        }

        if ($user->isStudent()) {
            // Check batch enrollment
            return \Illuminate\Support\Facades\DB::table('batch_student')
                ->where('user_id', $user->id)
                ->whereIn('batch_id', $liveClass->batches->pluck('id'))
                ->exists();
        }

        return false;
    }
}

