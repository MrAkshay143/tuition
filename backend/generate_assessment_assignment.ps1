# PowerShell script to create Assessment domain classes for Assignment
$baseDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Assessment"
$requestsDir = "$baseDir\Requests"
$actionsDir = "$baseDir\Actions"

# --- ASSIGNMENT REQUESTS ---
Set-Content -Path "$requestsDir\GetAssignmentsRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class GetAssignmentsRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\StoreAssignmentRequest.php" -Value '<?php
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
            "attachment"  => "nullable|file|max:10240",
        ];
    }
}'
Set-Content -Path "$requestsDir\UpdateAssignmentRequest.php" -Value '<?php
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
        ];
    }
}'
Set-Content -Path "$requestsDir\DeleteAssignmentRequest.php" -Value '<?php
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
}'
Set-Content -Path "$requestsDir\GetAssignmentSubmissionsRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Assignment;
class GetAssignmentSubmissionsRequest extends ApiFormRequest {
    public function authorize(): bool {
        $assignment = Assignment::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $assignment->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\GradeAssignmentRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Assessment\Models\Assignment;
class GradeAssignmentRequest extends ApiFormRequest {
    public function authorize(): bool {
        $assignment = Assignment::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $assignment->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array {
        $assignment = Assignment::findOrFail($this->route("id"));
        return [
            "grade"    => "required|numeric|min:0|max:" . $assignment->max_marks,
            "feedback" => "nullable|string",
        ];
    }
}'
Set-Content -Path "$requestsDir\SubmitAssignmentRequest.php" -Value '<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class SubmitAssignmentRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isStudent(); }
    public function rules(): array {
        return [
            "answer"     => "nullable|string",
            "attachment" => "nullable|file|max:10240",
        ];
    }
}'

# --- ASSIGNMENT ACTIONS ---
Set-Content -Path "$actionsDir\AssignmentActions.php" -Value '<?php
namespace App\Domains\Assessment\Actions;
use App\Domains\Assessment\Models\Assignment;
use App\Domains\Assessment\Models\AssignmentSubmission;
use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\DB;

class GetAssignmentsAction {
    public function execute(User $user, array $filters) {
        $query = Assignment::query()->with(["batches"])->withCount("submissions");
        if ($user->isTeacher()) $query->where("teacher_id", $user->id);
        if (isset($filters["batch_id"])) {
            $query->whereHas("batches", fn($q) => $q->where("batches.id", $filters["batch_id"]));
        }
        return $query->latest()->paginate(20);
    }
}
class StoreAssignmentAction {
    public function execute(array $data, int $teacherId, $attachment = null) {
        return DB::transaction(function() use ($data, $teacherId, $attachment) {
            $data["teacher_id"] = $teacherId;
            if ($attachment) {
                $data["attachment"] = $attachment->store("assignments", "public");
            }
            $assignment = Assignment::create($data);
            $assignment->batches()->sync($data["batch_ids"]);
            return $assignment->load("batches");
        });
    }
}
class UpdateAssignmentAction {
    public function execute(Assignment $assignment, array $data) {
        return DB::transaction(function() use ($assignment, $data) {
            $assignment->update($data);
            if (isset($data["batch_ids"])) {
                $assignment->batches()->sync($data["batch_ids"]);
            }
            return $assignment->load("batches");
        });
    }
}
class GradeAssignmentAction {
    public function execute(AssignmentSubmission $submission, array $data) {
        $submission->update([
            "grade"       => $data["grade"],
            "feedback"    => $data["feedback"],
            "status"      => "reviewed",
            "reviewed_at" => now(),
        ]);
        return $submission;
    }
}
class GetStudentAssignmentsAction {
    public function execute(User $user) {
        $batchIds = \Illuminate\Support\Facades\DB::table("enrollments")->where("user_id", $user->id)->pluck("batch_id");
        return Assignment::whereHas("batches", fn($q) => $q->whereIn("batches.id", $batchIds))
            ->with(["submissions" => fn($q) => $q->where("student_id", $user->id)])
            ->orderBy("due_at", "asc")
            ->paginate(20);
    }
}
class SubmitAssignmentAction {
    public function execute(Assignment $assignment, User $user, array $data, $attachment = null) {
        $submission = AssignmentSubmission::firstOrNew([
            "assignment_id" => $assignment->id,
            "student_id"    => $user->id,
        ]);
        if ($submission->status === "reviewed") throw new \Exception("This assignment has already been graded", 400);

        $submitData = [
            "answer"       => $data["answer"] ?? null,
            "status"       => "submitted",
            "submitted_at" => now(),
        ];
        if ($attachment) {
            $submitData["attachment"] = $attachment->store("submissions", "public");
        }
        $submission->fill($submitData);
        $submission->save();
        return $submission;
    }
}'

Write-Host "Assessment Assignment Actions/Requests created."
