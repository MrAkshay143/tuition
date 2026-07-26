<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class SendChatMessageRequest extends ApiFormRequest {
    public function authorize(): bool {
        return $this->user() !== null;
    }
    public function rules(): array {
        return [
            "message"              => "nullable|string|max:10000",
            "media_id"             => "nullable|integer|exists:media,id",
            "type"                 => "nullable|in:text,voice,media,file,call",
            "uuid"                 => "nullable|string|max:64",
            "reply_to_message_uuid" => "nullable|string|max:64",
        ];
    }
}

