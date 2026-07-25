<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Assignment;
class DeleteAssignmentRequest extends ApiFormRequest {
    public function authorize(): bool {
        $assignment = Assignment::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $assignment->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array { return []; }
}
