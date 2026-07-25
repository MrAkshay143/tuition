<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Exam;
class GetExamQuestionsRequest extends ApiFormRequest {
    public function authorize(): bool {
        $exam = Exam::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $exam->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array { return []; }
}
