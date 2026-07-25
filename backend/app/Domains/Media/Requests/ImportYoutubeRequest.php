<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class ImportYoutubeRequest extends ApiFormRequest {
    public function authorize(): bool { return Gate::allows("create", Media::class); }
    public function rules(): array {
        return [
            "youtube_url" => "required|url",
            "title" => "sometimes|string|max:255",
            "description" => "sometimes|nullable|string",
            "category_id" => "sometimes|nullable|integer|exists:content_categories,id",
            "visibility" => "sometimes|in:private,published,archived",
            "publish_at" => "sometimes|nullable|date",
            "tags" => "sometimes|nullable|string",
            "link_entities" => "sometimes|array",
        ];
    }
}
