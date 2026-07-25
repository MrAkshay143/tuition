<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\Course;

class StoreModuleRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) return false;

        $courseId = $this->route('courseId');
        if ($courseId) {
            $course = Course::find($courseId);
            if ($course) {
                return $user->role === 'admin' || $user->role === 'teacher' || Gate::allows('update', $course);
            }
        }

        return $user->role === 'admin' || $user->role === 'teacher';
    }

    public function rules(): array
    {
        return [
            'title'      => 'required|string|min:2|max:200',
            'sort_order' => 'sometimes|integer'
        ];
    }
}
