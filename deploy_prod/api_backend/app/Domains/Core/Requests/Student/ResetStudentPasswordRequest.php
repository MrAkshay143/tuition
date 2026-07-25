<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class ResetStudentPasswordRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $student = User::students()->findOrFail($this->route('id'));
        return Gate::allows('resetPassword', $student);
    }

    public function rules(): array
    {
        return [
            'password' => 'required|string|min:8'
        ];
    }
}
