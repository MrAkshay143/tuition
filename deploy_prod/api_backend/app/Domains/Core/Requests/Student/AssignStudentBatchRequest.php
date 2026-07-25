<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Domains\Core\DTOs\Student\AssignStudentBatchData;

class AssignStudentBatchRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $student = User::students()->findOrFail($this->route('id'));
        return Gate::allows('assignBatch', $student);
    }

    public function rules(): array
    {
        return [
            'batch_ids'   => 'required|array',
            'batch_ids.*' => 'exists:batches,id'
        ];
    }

    public function toDTO(): AssignStudentBatchData
    {
        return new AssignStudentBatchData(
            studentId: (int) $this->route('id'),
            batchIds: $this->validated('batch_ids')
        );
    }
}
