<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Exam;
class UpdateExamRequest extends ApiFormRequest {
    public function authorize(): bool {
        $exam = Exam::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $exam->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array {
        return [
            "title"                   => "sometimes|required|string|max:255",
            "description"             => "nullable|string",
            "type"                    => "sometimes|required|in:mcq,subjective,mixed",
            "duration_minutes"        => "sometimes|required|integer|min:1",
            "total_marks"             => "sometimes|required|numeric|min:1",
            "pass_marks"              => "sometimes|required|numeric|min:1|lte:total_marks",
            "starts_at"               => "nullable|date",
            "ends_at"                 => "nullable|date|after_or_equal:starts_at",
            "show_result_immediately" => "boolean",
            "shuffle_questions"       => "boolean",
            "batch_ids"               => "nullable|array",
            "batch_ids.*"             => "exists:batches,id",
        ];
    }
}
