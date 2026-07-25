<?php

namespace App\Domains\Learning\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;

class GetDashboardRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [];
    }
}
