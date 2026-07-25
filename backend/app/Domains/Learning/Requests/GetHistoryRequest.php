<?php

namespace App\Domains\Learning\Requests;

use App\Http\Requests\ApiFormRequest;

class GetHistoryRequest extends ApiFormRequest
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
