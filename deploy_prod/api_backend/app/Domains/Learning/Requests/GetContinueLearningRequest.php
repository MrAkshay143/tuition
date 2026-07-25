<?php

namespace App\Domains\Learning\Requests;

use App\Http\Requests\ApiFormRequest;

class GetContinueLearningRequest extends ApiFormRequest
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
