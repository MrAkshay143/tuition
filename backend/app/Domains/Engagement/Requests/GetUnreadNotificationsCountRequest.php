<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class GetUnreadNotificationsCountRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}
