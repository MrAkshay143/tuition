<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Domains\Core\Traits\ApiResponse;

abstract class ApiFormRequest extends FormRequest
{
    use ApiResponse;

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            $this->error('Validation Error', 422, $validator->errors())
        );
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization()
    {
        throw new HttpResponseException(
            $this->error('This action is unauthorized.', 403)
        );
    }
}
