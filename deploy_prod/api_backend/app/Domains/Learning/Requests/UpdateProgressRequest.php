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

        $lesson = Lesson::findOrFail($this->route('id'));
        $courseId = $lesson->module?->course_id;

        return Enrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'active')
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
