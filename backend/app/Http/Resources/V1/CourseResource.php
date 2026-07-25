<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'program_id' => $this->program_id,
            'subject_id' => $this->subject_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'status' => $this->status,
            'teacher_id' => $this->teacher_id,
            'teacher' => new UserResource($this->whenLoaded('teacher')),
            'thumbnail' => new MediaResource($this->whenLoaded('thumbnail')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'modules' => $this->relationLoaded('modules') ? $this->modules->map(function($module) use ($request) {
                $isV2 = $request->attributes->get('api_version') === 'v2';
                
                $moduleData = [
                    'id' => $module->id,
                    'course_id' => $module->course_id,
                    'title' => $module->title,
                    'sort_order' => $module->sort_order,
                ];

                if ($isV2) {
                    $moduleData['chapters'] = $module->relationLoaded('chapters') 
                        ? $module->chapters->map(function($chapter) {
                            return [
                                'id' => $chapter->id,
                                'title' => $chapter->title,
                                'sort_order' => $chapter->sort_order,
                                'lessons' => $chapter->relationLoaded('lessons') ? LessonResource::collection($chapter->lessons) : [],
                            ];
                        }) : [];
                } else {
                    $moduleData['lessons'] = $module->relationLoaded('lessons') ? LessonResource::collection($module->lessons) : [];
                }

                return $moduleData;
            }) : [],
        ];
    }
}
