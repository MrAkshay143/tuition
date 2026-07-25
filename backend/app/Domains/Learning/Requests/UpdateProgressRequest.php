<?php

namespace App\Domains\Learning\Requests;

use App\Http\Requests\ApiFormRequest;
use App\Domains\Learning\Models\Enrollment;
use App\Domains\Course\Models\Lesson;

class UpdateProgressRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        // Admins and teachers always allowed
        if (in_array($user->role, ['admin', 'teacher'])) {
            return true;
        }

        $lesson = Lesson::with('chapter.module')->findOrFail($this->route('id'));
        $courseId = $lesson->chapter?->module?->course_id;

        // Direct enrollment check
        $directEnrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->exists();

        if ($directEnrolled) return true;

        // Batch enrollment check
        return \Illuminate\Support\Facades\DB::table('batch_student')
            ->join('batch_course', 'batch_student.batch_id', '=', 'batch_course.batch_id')
            ->where('batch_student.student_id', $user->id)
            ->where('batch_course.course_id', $courseId)
            ->exists();
    }

    public function rules(): array
    {
        return [
            'watch_seconds'   => 'nullable|integer|min:0',
            'watched_seconds' => 'nullable|integer|min:0',
            'position'        => 'nullable|integer|min:0',
            'speed'           => 'nullable|numeric|min:0.5|max:2.0',
            'device_id'       => 'nullable|string|max:100',
            'completed'       => 'nullable|boolean',
        ];
    }
}
