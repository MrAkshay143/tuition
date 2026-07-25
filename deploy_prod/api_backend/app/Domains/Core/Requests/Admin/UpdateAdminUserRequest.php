<?php

namespace App\Domains\Core\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateAdminUserRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('id');
        return [
            'name'     => 'sometimes|string|min:2|max:100',
            'email'    => "sometimes|email|unique:users,email,{$id}",
            'password' => 'sometimes|string|min:8',
        ];
    }
}
