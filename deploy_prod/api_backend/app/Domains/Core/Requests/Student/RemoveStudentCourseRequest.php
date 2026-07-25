<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Domains\Core\DTOs\Student\AssignStudentCourseData;

class RemoveStudentCourseRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $student = User::students()->findOrFail($this->route('id'));
        return Gate::allows('removeCourse', $student);
    }

    public function rules(): array
    {
        return [
            'course_ids'   => 'required|array',
            'course_ids.*' => 'exists:courses,id'
        ];
    }

    public function toDTO(): AssignStudentCourseData
    {
        return new AssignStudentCourseData(
            studentId: (int) $this->route('id'),
            courseIds: $this->validated('course_ids')
        );
    }
}
