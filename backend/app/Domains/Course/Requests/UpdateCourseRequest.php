<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\Course;

class UpdateCourseRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $course = Course::findOrFail($this->route('course'));
        return Gate::allows('update', $course);
    }

    public function rules(): array
    {
        return [
            'title'           => 'sometimes|string|min:3|max:200',
            'description'     => 'nullable|string',
            'thumbnail'       => 'nullable|string',
            'status'          => 'sometimes|string|in:draft,published,archived',
            'sort_order'      => 'sometimes|integer',
            'publish_at'      => 'nullable|date',
            'unpublish_at'    => 'nullable|date|after_or_equal:publish_at',
            'timezone'        => 'nullable|string|max:100',
            'last_updated_at' => 'nullable|string',
            'teacher_id'      => 'nullable|integer|exists:users,id',
            'program_id'      => 'nullable|integer|exists:programs,id',
            'subject_id'      => 'nullable|integer|exists:subjects,id',
            'batch_ids'       => 'nullable|array',
            'batch_ids.*'     => 'integer|exists:batches,id',
        ];
    }
}
