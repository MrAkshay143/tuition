<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class SubmitAssignmentRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isStudent(); }
    public function rules(): array {
        return [
            "answer"     => "nullable|string",
            "media_id"   => "nullable|integer|exists:media,id",
        ];
    }
}
