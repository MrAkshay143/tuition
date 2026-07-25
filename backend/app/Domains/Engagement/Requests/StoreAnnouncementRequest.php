<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class StoreAnnouncementRequest extends ApiFormRequest {
    public function authorize(): bool { return $this->user()->isAdmin() || $this->user()->isTeacher(); }
    public function rules(): array {
        return [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'type' => 'required|string',
            'is_all' => 'boolean',
            'batch_ids' => 'required_if:is_all,false|array',
            'channels' => 'nullable|array'
        ];
    }
}
