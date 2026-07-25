<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Assignment;
class UpdateAssignmentRequest extends ApiFormRequest {
    public function authorize(): bool {
        $assignment = Assignment::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $assignment->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array {
        return [
            "title"       => "sometimes|required|string|max:255",
            "description" => "nullable|string",
            "due_at"      => "sometimes|required|date",
            "max_marks"   => "sometimes|required|integer|min:1",
            "batch_ids"   => "nullable|array",
            "batch_ids.*" => "exists:batches,id",
            "media_id"    => "nullable|integer|exists:media,id",
        ];
    }
}
