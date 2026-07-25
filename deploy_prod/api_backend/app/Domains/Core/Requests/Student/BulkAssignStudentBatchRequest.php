<?php
namespace App\Domains\Core\Requests\Student;
class BulkAssignStudentBatchRequest extends BulkStudentRequest {
    protected function gateName(): string { return 'assignBatch'; }
    public function rules(): array {
        return array_merge(parent::rules(), [
            'batch_ids'   => 'required|array',
            'batch_ids.*' => 'exists:batches,id'
        ]);
    }
}
