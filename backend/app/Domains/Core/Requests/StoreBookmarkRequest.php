<?php
namespace App\Domains\Core\Requests;
use App\Http\Requests\ApiFormRequest;
class StoreBookmarkRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'video_timestamp_seconds' => 'nullable|integer|min:0',
            'note'                    => 'nullable|string|max:500',
        ];
    }
}
