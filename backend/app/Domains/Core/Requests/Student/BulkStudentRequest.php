<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Core\Models\User;

abstract class BulkStudentRequest extends ApiFormRequest
{
    abstract protected function gateName(): string;

    public function authorize(): bool
    {
        return Gate::allows($this->gateName(), User::class);
    }

    public function rules(): array
    {
        return [
            'student_ids'   => 'required|array',
            'student_ids.*' => 'exists:users,id'
        ];
    }
}

