<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'description' => $this->description,
            'duration_minutes' => $this->duration_minutes,
            'total_marks' => $this->total_marks,
            'pass_marks' => $this->pass_marks,
            'teacher_id' => $this->teacher_id,
            'teacher' => new UserResource($this->whenLoaded('teacher')),
            'created_at' => $this->created_at,
        ];
    }
}
