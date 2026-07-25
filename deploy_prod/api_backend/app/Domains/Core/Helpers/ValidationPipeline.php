<?php

namespace App\Domains\Core\Helpers;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ValidationPipeline
{
    public static function validate(array $data, array $rules, array $messages = []): array
    {
        $validator = Validator::make($data, $rules, $messages);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }
}
