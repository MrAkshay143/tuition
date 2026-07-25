<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

abstract class AuthorizesStudentActionRequest extends ApiFormRequest
{
    /**
     * The name of the gate to check.
     */
    abstract protected function gateName(): string;

    public function authorize(): bool
    {
        $studentId = $this->route('id');
        $student = User::students()->findOrFail($studentId);
        
        return Gate::allows($this->gateName(), $student);
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
