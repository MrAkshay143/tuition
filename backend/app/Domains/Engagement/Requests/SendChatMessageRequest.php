<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class SendChatMessageRequest extends ApiFormRequest {
    public function authorize(): bool {
        return $this->user() !== null;
    }
    public function rules(): array {
        return [
            "message" => "required|string",
            "media_id" => "nullable|integer|exists:media,id"
        ];
    }
}
