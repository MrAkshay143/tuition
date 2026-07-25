<?php

namespace App\Domains\Core\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;

class DeleteAdminUserRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
