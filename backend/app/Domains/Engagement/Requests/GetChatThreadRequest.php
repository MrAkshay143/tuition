<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Core\Models\User;
class GetChatThreadRequest extends ApiFormRequest {
    public function authorize(): bool {
        return $this->user() !== null;
    }
    public function rules(): array { return []; }
}
