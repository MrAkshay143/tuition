<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class UpdateMediaRequest extends ApiFormRequest {
    public function authorize(): bool {
        $media = Media::findOrFail($this->route("id"));
        return Gate::allows("update", $media);
    }
    public function rules(): array {
        return [
            "name" => "sometimes|string|max:255",
            "description" => "sometimes|nullable|string",
            "category_id" => "sometimes|nullable|integer|exists:content_categories,id",
            "visibility" => "sometimes|in:private,published,archived",
            "publish_at" => "sometimes|nullable|date",
            "status" => "sometimes|in:draft,published,scheduled,archived",
            "tags" => "sometimes|nullable|string",
        ];
    }
}
