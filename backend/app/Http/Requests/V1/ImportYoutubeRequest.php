<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class ImportYoutubeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'url' => 'required|url',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'duration' => 'sometimes|nullable|integer',
            'category_id' => 'sometimes|nullable|integer|exists:content_categories,id',
            'visibility' => 'sometimes|in:private,published,archived',
            'publish_at' => 'sometimes|nullable|date',
            'tags' => 'sometimes|nullable|string',
            'link_entities' => 'sometimes|array',
            'link_entities.*.type' => 'required_with:link_entities|string',
            'link_entities.*.id' => 'required_with:link_entities|integer',
            'link_entities.*.link_type' => 'sometimes|string',
        ];
    }
}
