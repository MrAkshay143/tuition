<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\Lesson;

class AutosaveLessonRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $lesson = Lesson::findOrFail($this->route('id'));
        return Gate::allows('update', $lesson);
    }

    public function rules(): array
    {
        return [
            'content' => 'required|string',
        ];
    }
}
