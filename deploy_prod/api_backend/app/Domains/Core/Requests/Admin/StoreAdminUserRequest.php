<?php

namespace App\Domains\Core\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;

class StoreAdminUserRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|min:2|max:100',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:teacher,student,admin',
        ];
    }
}
