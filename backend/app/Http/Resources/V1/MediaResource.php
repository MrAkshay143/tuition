<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'mime' => $this->mime,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'size_bytes' => $this->size_bytes,
            'filename' => $this->filename,
            'provider' => $this->provider,
            'url' => $this->url,
            'thumbnail_url' => $this->thumbnail_url,
            'uploaded_by' => $this->uploaded_by,
            'uploader' => new UserResource($this->whenLoaded('uploader')),
            'visibility' => $this->visibility,
            'publish_at' => $this->publish_at,
            'category' => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ] : null,
            'tags' => $this->relationLoaded('tags') ? $this->tags->pluck('name') : [],
            'statistics' => $this->statistics ? [
                'views' => $this->statistics->views,
                'downloads' => $this->statistics->downloads,
                'last_viewed_at' => $this->statistics->last_viewed_at,
                'last_downloaded_at' => $this->statistics->last_downloaded_at,
            ] : [
                'views' => 0,
                'downloads' => 0,
                'last_viewed_at' => null,
                'last_downloaded_at' => null,
            ],
            'created_at' => $this->created_at,
        ];
    }
}
