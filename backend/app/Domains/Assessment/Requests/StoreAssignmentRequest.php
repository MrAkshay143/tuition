<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class StoreAssignmentRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isAdmin() || $this->user()->isTeacher(); }
    public function rules(): array {
        return [
            "title"       => "required|string|max:255",
            "description" => "nullable|string",
            "due_at"      => "required|date",
            "max_marks"   => "required|integer|min:1",
            "batch_ids"   => "required|array|min:1",
            "batch_ids.*" => "exists:batches,id",
            "media_id"    => "nullable|integer|exists:media,id",
        ];
    }
}
