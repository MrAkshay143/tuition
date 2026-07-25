# PowerShell script to create Assessment domain classes
$baseDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Assessment"
$requestsDir = "$baseDir\Requests"
$actionsDir = "$baseDir\Actions"

New-Item -ItemType Directory -Force -Path $requestsDir | Out-Null
New-Item -ItemType Directory -Force -Path $actionsDir | Out-Null

# --- EXAM REQUESTS ---
Set-Content -Path "$requestsDir\GetExamsRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class GetExamsRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\StoreExamRequest.php" -Value '<?php
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
}'
Set-Content -Path "$requestsDir\UpdateExamRequest.php" -Value '<?php
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
}'
Set-Content -Path "$requestsDir\DeleteExamRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Exam;
class DeleteExamRequest extends ApiFormRequest {
    public function authorize(): bool {
        $exam = Exam::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $exam->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\GetExamQuestionsRequest.php" -Value '<?php
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
}'
Set-Content -Path "$requestsDir\StoreExamQuestionRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Exam;
class StoreExamQuestionRequest extends ApiFormRequest {
    public function authorize(): bool {
        $exam = Exam::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $exam->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array {
        return [
            "question"       => "required|string",
            "type"           => "required|in:mcq,subjective",
            "options"        => "required_if:type,mcq|array|min:2",
            "correct_answer" => "required_if:type,mcq|string",
            "marks"          => "required|numeric|min:1",
            "sort_order"     => "integer",
        ];
    }
}'
Set-Content -Path "$requestsDir\UpdateExamQuestionRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Exam;
class UpdateExamQuestionRequest extends ApiFormRequest {
    public function authorize(): bool {
        $exam = Exam::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $exam->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array {
        return [
            "question"       => "sometimes|required|string",
            "type"           => "sometimes|required|in:mcq,subjective",
            "options"        => "nullable|array|min:2",
            "correct_answer" => "nullable|string",
            "marks"          => "sometimes|required|numeric|min:1",
            "sort_order"     => "integer",
        ];
    }
}'
Set-Content -Path "$requestsDir\DeleteExamQuestionRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Exam;
class DeleteExamQuestionRequest extends ApiFormRequest {
    public function authorize(): bool {
        $exam = Exam::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $exam->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\StartExamRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class StartExamRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isStudent(); }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\SubmitExamRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class SubmitExamRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isStudent(); }
    public function rules(): array { return ["answers" => "required|array"]; }
}'

# --- EXAM ACTIONS ---
Set-Content -Path "$actionsDir\ExamActions.php" -Value '<?php
namespace App\Domains\Assessment\Actions;
use App\Domains\Assessment\Models\Exam;
use App\Domains\Assessment\Models\ExamAttempt;
use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\DB;

class GetExamsAction {
    public function execute(User $user, array $filters) {
        $query = Exam::query()->with(["batches"])->withCount("attempts");
        if ($user->isTeacher()) $query->where("teacher_id", $user->id);
        if (isset($filters["batch_id"])) {
            $query->whereHas("batches", fn($q) => $q->where("batches.id", $filters["batch_id"]));
        }
        return $query->latest()->paginate(20);
    }
}
class StoreExamAction {
    public function execute(array $data, int $teacherId) {
        return DB::transaction(function() use ($data, $teacherId) {
            $data["teacher_id"] = $teacherId;
            $exam = Exam::create($data);
            $exam->batches()->sync($data["batch_ids"]);
            return $exam->load("batches");
        });
    }
}
class UpdateExamAction {
    public function execute(Exam $exam, array $data) {
        return DB::transaction(function() use ($exam, $data) {
            $exam->update($data);
            if (isset($data["batch_ids"])) {
                $exam->batches()->sync($data["batch_ids"]);
            }
            return $exam->load("batches");
        });
    }
}
class GetStudentExamsAction {
    public function execute(User $user) {
        $batchIds = \Illuminate\Support\Facades\DB::table("enrollments")->where("user_id", $user->id)->pluck("batch_id");
        return Exam::whereHas("batches", fn($q) => $q->whereIn("batches.id", $batchIds))
            ->with(["attempts" => fn($q) => $q->where("student_id", $user->id)])
            ->latest()
            ->paginate(20);
    }
}
class SubmitExamAction {
    public function execute(Exam $exam, User $user, array $answers) {
        $attempt = ExamAttempt::where("exam_id", $exam->id)->where("student_id", $user->id)->firstOrFail();
        if ($attempt->submitted_at) throw new \Exception("Exam already submitted", 400);

        $score = 0;
        $questions = $exam->questions->keyBy("id");
        foreach ($answers as $qId => $answerStr) {
            $question = $questions->get($qId);
            if ($question && $question->type === "mcq") {
                if (trim(strtolower($question->correct_answer)) === trim(strtolower($answerStr))) {
                    $score += $question->marks;
                }
            }
        }
        $percentage = ($exam->total_marks > 0) ? ($score / $exam->total_marks) * 100 : 0;
        $passed = $score >= $exam->pass_marks;
        $attempt->update([
            "answers"      => $answers,
            "score"        => $score,
            "percentage"   => $percentage,
            "passed"       => $passed,
            "submitted_at" => now(),
        ]);
        return $attempt;
    }
}'

Write-Host "Assessment Exam Actions/Requests created."
