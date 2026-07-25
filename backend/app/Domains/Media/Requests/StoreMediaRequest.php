<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class StoreMediaRequest extends ApiFormRequest {
    public function authorize(): bool { return Gate::allows("create", Media::class); }
    public function rules(): array {
        return [
            "file" => "required|file|max:2097152",
            "title" => "sometimes|string|max:255",
            "description" => "sometimes|nullable|string",
            "category_id" => "sometimes|nullable|integer|exists:content_categories,id",
            "visibility" => "sometimes|in:private,published,archived",
            "publish_at" => "sometimes|nullable|date",
            "tags" => "sometimes|nullable|string",
            "link_entities" => "sometimes|array",
            "link_entities.*.type" => "required_with:link_entities|string",
            "link_entities.*.id" => "required_with:link_entities|integer",
            "link_entities.*.link_type" => "sometimes|string",
        ];
    }
}
