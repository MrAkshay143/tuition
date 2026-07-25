<?php

namespace App\Domains\Core\Requests\Batch;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\Batch;

class GetBatchesRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('viewAny', Batch::class);
    }

    public function rules(): array
    {
        return [];
    }
}
