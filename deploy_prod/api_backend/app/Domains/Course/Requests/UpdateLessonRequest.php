<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\Lesson;

class UpdateLessonRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $lesson = Lesson::findOrFail($this->route('id'));
        return Gate::allows('update', $lesson);
    }

    public function rules(): array
    {
        return [
            'title'            => 'sometimes|string|min:2|max:200',
            'type'             => 'sometimes|string|in:video,text,quiz',
            'content'          => 'nullable|string',
            'video_url'        => 'nullable|string|url',
            'video_provider'   => 'nullable|string|in:youtube,upload,vimeo',
            'duration_seconds' => 'nullable|integer',
            'is_free_preview'  => 'sometimes|boolean',
            'sort_order'       => 'sometimes|integer',
            'primary_media_id' => 'nullable|integer|exists:media,id',
            'download_media_id'=> 'nullable|integer|exists:media,id',
        ];
    }
}
