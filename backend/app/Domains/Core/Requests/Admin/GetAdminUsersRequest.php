<?php

namespace App\Domains\Core\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Core\Models\User;

class GetAdminUsersRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) return false;
        return $user->isAdmin() || $user->isTeacher() || $user->hasRole('admin') || $user->hasRole('teacher') || $user->hasPermissionTo('student.view');
    }

    public function rules(): array
    {
        return [];
    }
}
