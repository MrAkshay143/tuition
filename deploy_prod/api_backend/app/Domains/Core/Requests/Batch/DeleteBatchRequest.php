<?php

namespace App\Domains\Core\Requests\Batch;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\Batch;

class DeleteBatchRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $batch = Batch::findOrFail($this->route('id'));
        return Gate::allows('delete', $batch);
    }

    public function rules(): array
    {
        return [];
    }
}
