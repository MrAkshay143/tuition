<?php

namespace App\Domains\Learning\Requests;

use App\Http\Requests\ApiFormRequest;
use App\Domains\Learning\Models\Enrollment;
use App\Domains\Course\Models\Lesson;

class CompleteLessonRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        $lesson = Lesson::findOrFail($this->route('id'));
        $courseId = $lesson->module?->course_id;

        return Enrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->exists();
    }

    public function rules(): array
    {
        return [];
    }
}
