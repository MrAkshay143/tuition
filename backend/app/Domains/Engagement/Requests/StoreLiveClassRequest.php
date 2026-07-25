<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class StoreLiveClassRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()?->isAdmin() || $this->user()?->isTeacher(); }
    public function rules(): array {
        return [
            "title"               => "required|string|max:255",
            "description"         => "nullable|string",
            "provider"            => "required|in:zoom,meet,teams,jitsi,custom",
            "meeting_id"          => "nullable|string|max:255",
            "meeting_url"         => "nullable|url",
            "password"            => "nullable|string|max:50",
            "host_link"           => "nullable|url",
            "join_before_minutes" => "nullable|integer|min:0",
            "waiting_room"        => "nullable|boolean",
            "scheduled_at"        => "required|date",
            "duration_minutes"    => "required|integer|min:1",
            "batch_ids"           => "required|array|min:1",
            "batch_ids.*"         => "exists:batches,id",
        ];
    }
}
