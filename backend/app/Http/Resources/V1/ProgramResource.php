<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'education_type_id' => $this->education_type_id,
            'academic_session_id' => $this->academic_session_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'thumbnail' => $this->thumbnail,
            'is_active' => $this->is_active,
            'order_index' => $this->order_index,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'education_type' => new EducationTypeResource($this->whenLoaded('educationType')),
            'academic_session' => new AcademicSessionResource($this->whenLoaded('academicSession')),
            'courses' => CourseResource::collection($this->whenLoaded('courses')),
        ];
    }
}
