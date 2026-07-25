<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class GetNotificationsRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}
