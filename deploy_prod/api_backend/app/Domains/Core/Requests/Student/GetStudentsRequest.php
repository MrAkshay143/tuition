<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;

class GetStudentsRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('viewAny', \App\Models\User::class);
    }

    public function rules(): array
    {
        return [];
    }
}
