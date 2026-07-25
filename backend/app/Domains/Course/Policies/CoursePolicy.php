<?php

namespace App\Domains\Course\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use Illuminate\Auth\Access\HandlesAuthorization;

class CoursePolicy
{
    use HandlesAuthorization;

    public function before(User $user, $ability)
    {
        // Only admins bypass all policy checks
        if ($user->isAdmin()) {
            return true;
        }
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Course $course): bool
    {
        if ($user->isTeacher()) {
            return $course->isOwnedBy($user);
        }

        return $course->status === 'published';
    }

    public function viewLesson(User $user, Course $course): bool
    {
        if ($user->isTeacher()) {
            return $course->isOwnedBy($user);
        }

        // Student enrollment verification via direct course or batch assignment
        return $user->courses()->where('courses.id', $course->id)->exists()
            || $user->batches()->whereHas('courses', fn($q) => $q->where('courses.id', $course->id))->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('course.create');
    }

    public function update(User $user, Course $course): bool
    {
        return $user->hasPermissionTo('course.update') && $course->isOwnedBy($user);
    }

    public function delete(User $user, Course $course): bool
    {
        return $user->hasPermissionTo('course.archive') && $course->isOwnedBy($user);
    }
}
