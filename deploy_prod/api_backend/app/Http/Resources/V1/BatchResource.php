<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'uuid'           => $this->uuid,
            'name'           => $this->name,
            'description'    => $this->description,
            'teacher_id'     => $this->teacher_id,
            'program_id'     => $this->program_id,
            'session_id'     => $this->session_id,
            'teacher'        => new UserResource($this->whenLoaded('teacher')),
            'students'       => UserResource::collection($this->whenLoaded('students')),
            'courses'        => $this->whenLoaded('courses'),
            'program'        => $this->whenLoaded('program'),
            'session'        => $this->whenLoaded('session'),
            'color'          => $this->color,
            'is_active'      => (bool)$this->is_active,
            'students_count' => $this->whenCounted('students'),
            'courses_count'  => $this->whenCounted('courses'),
            'created_at'     => $this->created_at,
        ];
    }
}
