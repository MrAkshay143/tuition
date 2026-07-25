<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\CourseModule;

class StoreLessonRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) return false;

        $chapterId = $this->route('chapterId');
        if ($chapterId) {
            $chapter = \App\Domains\Course\Models\CourseChapter::find($chapterId);
            if ($chapter && $chapter->module) {
                return $user->role === 'admin' || $user->role === 'teacher' || Gate::allows('update', $chapter->module->course);
            }
        }

        $moduleId = $this->route('moduleId');
        if ($moduleId) {
            $module = CourseModule::find($moduleId);
            if ($module) {
                return $user->role === 'admin' || $user->role === 'teacher' || Gate::allows('update', $module->course);
            }
        }

        return $user->role === 'admin' || $user->role === 'teacher';
    }

    public function rules(): array
    {
        return [
            'title'            => 'required|string|min:2|max:200',
            'type'             => 'required|string|in:video,text,quiz',
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
