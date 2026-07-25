<?php

namespace App\Domains\Core\Requests\Batch;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\Batch;

class StoreBatchRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Batch::class);
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|min:2|max:100',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:10',
            'is_active'   => 'boolean',
            'teacher_id'  => 'nullable|integer|exists:users,id',
            'program_id'  => 'nullable|integer|exists:programs,id',
            'session_id'  => 'nullable|integer|exists:academic_sessions,id',
        ];
    }
}
