<?php
namespace App\Domains\Assessment\Requests;
use App\Http\Requests\ApiFormRequest;
class GetAssignmentsRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}
