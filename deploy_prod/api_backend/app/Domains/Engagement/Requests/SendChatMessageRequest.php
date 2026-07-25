<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class SendChatMessageRequest extends ApiFormRequest {
    public function authorize(): bool {
        $partnerId = $this->route("partnerId");
        $user = $this->user();
        if ($user->isAdmin()) return true;
        if ($user->isTeacher()) {
            return \Illuminate\Support\Facades\DB::table("enrollments")
                ->join("batches", "enrollments.batch_id", "=", "batches.id")
                ->where("batches.teacher_id", $user->id)
                ->where("enrollments.user_id", $partnerId)
                ->exists();
        }
        if ($user->isStudent()) {
            return \Illuminate\Support\Facades\DB::table("enrollments")
                ->join("batches", "enrollments.batch_id", "=", "batches.id")
                ->where("enrollments.user_id", $user->id)
                ->where("batches.teacher_id", $partnerId)
                ->exists();
        }
        return false;
    }
    public function rules(): array {
        return [
            "message" => "required|string",
            "media_id" => "nullable|integer|exists:media,id"
        ];
    }
}
