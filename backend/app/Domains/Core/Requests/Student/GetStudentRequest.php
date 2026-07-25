<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Core\Models\User;

class GetStudentRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        // View authorization includes teacher-student association checks via the policy
        $student = User::students()->findOrFail($this->route('id'));
        return Gate::allows('view', $student);
    }

    public function rules(): array
    {
        return [];
    }
}

