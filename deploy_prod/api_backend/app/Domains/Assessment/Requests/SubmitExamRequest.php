<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class SubmitExamRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isStudent(); }
    public function rules(): array { return ["answers" => "required|array"]; }
}
