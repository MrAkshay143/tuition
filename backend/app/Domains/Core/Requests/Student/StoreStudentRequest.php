<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use App\Domains\Core\DTOs\Student\StoreStudentData;
use Illuminate\Support\Facades\Gate;

class StoreStudentRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', \App\Domains\Core\Models\User::class);
    }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|min:2|max:100',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
        ];
    }

    public function toDTO(): StoreStudentData
    {
        return new StoreStudentData(
            name: $this->validated('name'),
            email: $this->validated('email'),
            password: $this->validated('password'),
            phone: $this->validated('phone')
        );
    }
}

