<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class ReplaceMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|max:2097152',
        ];
    }
}
