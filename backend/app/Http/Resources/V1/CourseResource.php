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
            'lessons_count' => $this->relationLoaded('modules') ? $this->modules->reduce(function($acc, $module) {
                $modLessons = $module->relationLoaded('lessons') ? $module->lessons->count() : 0;
                $chapLessons = $module->relationLoaded('chapters') ? $module->chapters->sum(fn($ch) => $ch->relationLoaded('lessons') ? $ch->lessons->count() : 0) : 0;
                return $acc + max($modLessons, $chapLessons);
            }, 0) : 0,
            'modules' => $this->relationLoaded('modules') ? $this->modules->map(function($module) use ($request) {
                $chapters = $module->relationLoaded('chapters') && $module->chapters->isNotEmpty()
                    ? $module->chapters->map(function($chapter) {
                        return [
                            'id' => $chapter->id,
                            'title' => $chapter->title,
                            'sort_order' => $chapter->sort_order,
                            'lessons' => $chapter->relationLoaded('lessons') ? LessonResource::collection($chapter->lessons) : [],
                        ];
                    })
                    : collect();

                $directLessons = $module->relationLoaded('lessons') ? LessonResource::collection($module->lessons) : collect();

                if ($chapters->isEmpty() && $directLessons->isNotEmpty()) {
                    $chapters = collect([[
                        'id' => $module->id * 1000,
                        'title' => 'General Lessons',
                        'sort_order' => 1,
                        'lessons' => $directLessons,
                    ]]);
                }

                return [
                    'id' => $module->id,
                    'course_id' => $module->course_id,
                    'title' => $module->title,
                    'sort_order' => $module->sort_order,
                    'chapters' => $chapters,
                    'lessons' => $directLessons,
                ];
            }) : [],
        ];
    }
}
