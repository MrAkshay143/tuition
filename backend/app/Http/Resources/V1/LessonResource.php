<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chapter_id' => $this->chapter_id,
            'title' => $this->title,
            'type' => $this->type,
            'content' => $this->content,
            'duration_seconds' => $this->duration_seconds,
            'is_free_preview' => $this->is_free_preview,
            'sort_order' => $this->sort_order,
            'primary_media' => $this->whenLoaded('primaryMedia', fn() => $this->primaryMedia->first() ? new MediaResource($this->primaryMedia->first()) : null),
            'download_media' => $this->whenLoaded('downloadMedia', fn() => $this->downloadMedia->first() ? new MediaResource($this->downloadMedia->first()) : null),
            'primary_media_id' => $this->whenLoaded('primaryMedia', fn() => $this->primaryMedia->first()?->id),
            'download_media_id' => $this->whenLoaded('downloadMedia', fn() => $this->downloadMedia->first()?->id),
        ];
    }
}
