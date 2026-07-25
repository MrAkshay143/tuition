<?php

namespace App\Domains\Core\Requests\Batch;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\Batch;

class RemoveBatchStudentsRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $batch = Batch::findOrFail($this->route('id'));
        return Gate::allows('update', $batch);
    }

    public function rules(): array
    {
        return [
            'student_ids'   => 'required|array',
            'student_ids.*' => 'exists:users,id',
        ];
    }
}
