<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class StoreExamRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isAdmin() || $this->user()->isTeacher(); }
    public function rules(): array {
        return [
            "title"                   => "required|string|max:255",
            "description"             => "nullable|string",
            "type"                    => "required|in:mcq,subjective,mixed",
            "duration_minutes"        => "required|integer|min:1",
            "total_marks"             => "required|numeric|min:1",
            "pass_marks"              => "required|numeric|min:1|lte:total_marks",
            "starts_at"               => "nullable|date",
            "ends_at"                 => "nullable|date|after_or_equal:starts_at",
            "show_result_immediately" => "boolean",
            "shuffle_questions"       => "boolean",
            "batch_ids"               => "required|array|min:1",
            "batch_ids.*"             => "exists:batches,id",
        ];
    }
}
