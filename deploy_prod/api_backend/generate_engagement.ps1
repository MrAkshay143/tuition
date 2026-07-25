# PowerShell script to create Engagement domain classes
$baseDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Engagement"
$requestsDir = "$baseDir\Requests"
$actionsDir = "$baseDir\Actions"

New-Item -ItemType Directory -Force -Path $requestsDir | Out-Null
New-Item -ItemType Directory -Force -Path $actionsDir | Out-Null

# 1. LiveClass Requests
Set-Content -Path "$requestsDir\GetLiveClassesRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class GetLiveClassesRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'

Set-Content -Path "$requestsDir\StoreLiveClassRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class StoreLiveClassRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()?->isAdmin() || $this->user()?->isTeacher(); }
    public function rules(): array {
        return [
            "title"            => "required|string|max:255",
            "description"      => "nullable|string",
            "provider"         => "required|in:zoom,meet,jitsi,livekit",
            "meeting_id"       => "nullable|string|max:255",
            "meeting_url"      => "nullable|url",
            "password"         => "nullable|string|max:50",
            "scheduled_at"     => "required|date",
            "duration_minutes" => "required|integer|min:1",
            "batch_ids"        => "required|array|min:1",
            "batch_ids.*"      => "exists:batches,id",
        ];
    }
}'

Set-Content -Path "$requestsDir\UpdateLiveClassRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Facades\Gate;
class UpdateLiveClassRequest extends ApiFormRequest {
    public function authorize(): bool {
        $liveClass = LiveClass::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $liveClass->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array {
        return [
            "title"            => "sometimes|string|max:255",
            "description"      => "nullable|string",
            "provider"         => "sometimes|in:zoom,meet,jitsi,livekit",
            "meeting_id"       => "nullable|string|max:255",
            "meeting_url"      => "nullable|url",
            "password"         => "nullable|string|max:50",
            "scheduled_at"     => "sometimes|date",
            "duration_minutes" => "sometimes|integer|min:1",
            "batch_ids"        => "sometimes|array|min:1",
            "batch_ids.*"      => "exists:batches,id",
        ];
    }
}'

Set-Content -Path "$requestsDir\DeleteLiveClassRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\LiveClass\Models\LiveClass;
class DeleteLiveClassRequest extends ApiFormRequest {
    public function authorize(): bool {
        $liveClass = LiveClass::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $liveClass->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array { return []; }
}'

Set-Content -Path "$requestsDir\RecordAttendanceRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class RecordAttendanceRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            "duration_minutes" => "required|integer|min:1",
            "device_info"      => "nullable|string"
        ];
    }
}'

# 2. LiveClass Actions
Set-Content -Path "$actionsDir\GetLiveClassesAction.php" -Value '<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
class GetLiveClassesAction {
    public function execute(User $user, array $filters): LengthAwarePaginator {
        $query = LiveClass::query()->with("batches");
        if ($user->isTeacher()) $query->where("teacher_id", $user->id);
        if ($user->isStudent()) {
            $batchIds = \Illuminate\Support\Facades\DB::table("enrollments")->where("user_id", $user->id)->pluck("batch_id");
            $query->whereHas("batches", fn($q) => $q->whereIn("batches.id", $batchIds));
        }
        if (isset($filters["batch_id"])) {
            $query->whereHas("batches", fn($q) => $q->where("batches.id", $filters["batch_id"]));
        }
        if (isset($filters["status"])) $query->where("status", $filters["status"]);
        return $query->latest("scheduled_at")->paginate(20);
    }
}'

Set-Content -Path "$actionsDir\StoreLiveClassAction.php" -Value '<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Facades\DB;
class StoreLiveClassAction {
    public function execute(array $data, int $teacherId): LiveClass {
        return DB::transaction(function() use ($data, $teacherId) {
            $data["teacher_id"] = $teacherId;
            $data["status"] = "scheduled";
            $liveClass = LiveClass::create($data);
            $liveClass->batches()->sync($data["batch_ids"]);
            return $liveClass->load("batches");
        });
    }
}'

Set-Content -Path "$actionsDir\UpdateLiveClassAction.php" -Value '<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Facades\DB;
class UpdateLiveClassAction {
    public function execute(LiveClass $liveClass, array $data): LiveClass {
        return DB::transaction(function() use ($liveClass, $data) {
            $liveClass->update($data);
            if (isset($data["batch_ids"])) {
                $liveClass->batches()->sync($data["batch_ids"]);
            }
            return $liveClass->load("batches");
        });
    }
}'

Set-Content -Path "$actionsDir\DeleteLiveClassAction.php" -Value '<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Facades\DB;
class DeleteLiveClassAction {
    public function execute(LiveClass $liveClass): void {
        DB::transaction(function() use ($liveClass) {
            $liveClass->batches()->detach();
            $liveClass->delete();
        });
    }
}'

Set-Content -Path "$actionsDir\RecordAttendanceAction.php" -Value '<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\LiveClass\Models\LiveClassAttendance;
use App\Domains\Core\Models\User;
class RecordAttendanceAction {
    public function execute(LiveClass $liveClass, User $student, array $data): LiveClassAttendance {
        return LiveClassAttendance::updateOrCreate(
            ["live_class_id" => $liveClass->id, "student_id" => $student->id],
            [
                "joined_at" => now(),
                "duration_minutes" => \Illuminate\Support\Facades\DB::raw("duration_minutes + " . $data["duration_minutes"]),
                "device_info" => $data["device_info"] ?? null,
            ]
        );
    }
}'

Write-Host "LiveClass Engagement layer generated"
