<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\Course;

class DeleteCourseRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $course = Course::findOrFail($this->route('course'));
        return Gate::allows('delete', $course);
    }

    public function rules(): array
    {
        return [];
    }
}
