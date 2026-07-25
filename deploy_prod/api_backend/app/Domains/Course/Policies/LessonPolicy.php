<?php

namespace App\Domains\Course\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Lesson;
use Illuminate\Auth\Access\HandlesAuthorization;

class LessonPolicy
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

    public function view(User $user, Lesson $lesson): bool
    {
        $course = $lesson->module->course;

        if ($user->isTeacher()) {
            return $course->isOwnedBy($user);
        }

        return $course->status === 'published';
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('course.update');
    }

    public function update(User $user, Lesson $lesson): bool
    {
        $course = $lesson->module->course;
        return $user->hasPermission('course.update') && $course->isOwnedBy($user);
    }

    public function delete(User $user, Lesson $lesson): bool
    {
        $course = $lesson->module->course;
        return $user->hasPermission('course.update') && $course->isOwnedBy($user);
    }
}
