<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaStatisticsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'media_id' => $this->media_id,
            'views' => $this->views,
            'downloads' => $this->downloads,
            'last_viewed_at' => $this->last_viewed_at,
            'last_downloaded_at' => $this->last_downloaded_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
