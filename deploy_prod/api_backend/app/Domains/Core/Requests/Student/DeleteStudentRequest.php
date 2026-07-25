<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;

class DeleteStudentRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $student = \App\Models\User::students()->findOrFail($this->studentId());
        return Gate::allows('delete', $student);
    }

    public function rules(): array
    {
        return [];
    }

    public function studentId(): int
    {
        return (int) $this->route('id');
    }
}
