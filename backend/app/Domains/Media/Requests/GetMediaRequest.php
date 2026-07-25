<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
class GetMediaRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}
