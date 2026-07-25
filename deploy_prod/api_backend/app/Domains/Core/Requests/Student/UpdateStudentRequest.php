<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use App\Domains\Core\DTOs\Student\UpdateStudentData;
use Illuminate\Support\Facades\Gate;

class UpdateStudentRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $student = \App\Models\User::students()->findOrFail($this->route('id'));
        return Gate::allows('update', $student);
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'     => 'sometimes|string|min:2|max:100',
            'email'    => "sometimes|email|unique:users,email,{$id}",
            'phone'    => 'nullable|string|max:20',
            'password' => 'sometimes|string|min:8',
        ];
    }

    public function toDTO(): UpdateStudentData
    {
        return new UpdateStudentData(
            id: (int) $this->route('id'),
            name: $this->validated('name'),
            email: $this->validated('email'),
            password: $this->validated('password'),
            phone: $this->validated('phone')
        );
    }
}
