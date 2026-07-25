<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Course;
use Illuminate\Validation\ValidationException;

class PublishValidationService
{
    public function validate(Course $course): array
    {
        $errors = [];
        if (empty($course->description)) {
            $errors['description'] = 'Course description is required for publishing.';
        }
        if (empty($course->thumbnail)) {
            $errors['thumbnail'] = 'Course thumbnail image is required for publishing.';
        }
        if ($course->modules()->count() === 0) {
            $errors['modules'] = 'Course must contain at least one module chapter.';
        }

        $hasLesson = false;
        foreach ($course->modules as $module) {
            if ($module->lessons()->count() > 0) {
                $hasLesson = true;
                break;
            }
        }
        if (!$hasLesson) {
            $errors['lessons'] = 'Course must contain at least one lesson syllabus item.';
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        return ['valid' => true];
    }
}
