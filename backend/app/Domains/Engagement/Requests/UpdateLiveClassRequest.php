<?php
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
            "title"               => "sometimes|string|max:255",
            "description"         => "nullable|string",
            "provider"            => "sometimes|in:zoom,meet,teams,jitsi,custom",
            "meeting_id"          => "nullable|string|max:255",
            "meeting_url"         => "nullable|url",
            "password"            => "nullable|string|max:50",
            "host_link"           => "nullable|url",
            "join_before_minutes" => "nullable|integer|min:0",
            "waiting_room"        => "nullable|boolean",
            "scheduled_at"        => "sometimes|date",
            "duration_minutes"    => "sometimes|integer|min:1",
            "batch_ids"           => "sometimes|array|min:1",
            "batch_ids.*"         => "exists:batches,id",
        ];
    }
}
