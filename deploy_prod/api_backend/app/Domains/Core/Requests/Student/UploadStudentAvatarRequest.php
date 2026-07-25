<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class UploadStudentAvatarRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $student = User::students()->findOrFail($this->route('id'));
        return Gate::allows('update', $student);
    }

    public function rules(): array
    {
        return [
            'avatar' => 'required|image|max:2048'
        ];
    }
}
