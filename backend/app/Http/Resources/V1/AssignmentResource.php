<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'description' => $this->description,
            'due_at' => $this->due_at,
            'max_marks' => $this->max_marks,
            'teacher_id' => $this->teacher_id,
            'teacher' => new UserResource($this->whenLoaded('teacher')),
            'created_at' => $this->created_at,
        ];
    }
}
