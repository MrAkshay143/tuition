<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'avatar'         => $this->avatar,
            'active'         => $this->active,
            'last_login_at'  => $this->last_login_at,
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
            
            // Loaded Relationships
            'batches'        => BatchResource::collection($this->whenLoaded('batches')),
        ];
    }
}
