<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseEditSession;
use Illuminate\Validation\ValidationException;

class AcquireCourseLockAction
{
    public function execute(Course $course, int $userId): CourseEditSession
    {
        // Look for active lock by another user
        $activeLock = CourseEditSession::where('course_id', $course->id)
            ->where('user_id', '!=', $userId)
            ->where('expires_at', '>', now())
            ->first();

        if ($activeLock) {
            $activeLock->load('user');
            throw ValidationException::withMessages([
                'course' => "This course is currently being edited by {$activeLock->user->name}. Please try again later."
            ]);
        }

        // Acquire or refresh lock for current user
        return CourseEditSession::updateOrCreate(
            ['course_id' => $course->id, 'user_id' => $userId],
            [
                'locked_at'        => now(),
                'expires_at'       => now()->addMinutes(15),
                'last_activity_at' => now()
            ]
        );
    }
}
