<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaUsageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'media_id' => $this->media_id,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'link_type' => $this->link_type,
            'display_order' => $this->display_order,
            'details' => $this->resolveEntityDetails(),
        ];
    }

    protected function resolveEntityDetails(): array
    {
        // Check dynamic relations or load entity attributes
        $entityType = $this->entity_type;
        $entityId = $this->entity_id;

        // Since it's polymorphic, let's load it dynamically if not preloaded
        $entity = null;
        try {
            $entity = $entityType::find($entityId);
        } catch (\Throwable $e) {}

        if (!$entity) {
            return [
                'type' => class_basename($entityType),
                'name' => 'Unknown Reference',
                'url' => '#',
            ];
        }

        $class = class_basename($entityType);

        switch ($class) {
            case 'Course':
                return [
                    'type' => 'Course',
                    'name' => $entity->title ?? $entity->name ?? 'Untitled Course',
                    'url' => "/teacher/courses/{$entity->id}",
                ];
            case 'Batch':
                return [
                    'type' => 'Batch',
                    'name' => $entity->name ?? 'Untitled Batch',
                    'url' => "/teacher/batches",
                ];
            case 'Lesson':
                $courseId = $entity->module?->course?->id;
                return [
                    'type' => 'Lesson',
                    'name' => $entity->title ?? 'Untitled Lesson',
                    'url' => $courseId ? "/teacher/courses/{$courseId}/builder" : "/teacher/courses",
                    'course_name' => $entity->module?->course?->title ?? 'N/A',
                    'module_name' => $entity->module?->title ?? 'N/A',
                ];
            case 'Subject':
                return [
                    'type' => 'Subject',
                    'name' => $entity->name ?? 'Untitled Subject',
                    'url' => "/teacher/subjects",
                ];
            default:
                return [
                    'type' => $class,
                    'name' => $entity->title ?? $entity->name ?? 'Unnamed',
                    'url' => '#',
                ];
        }
    }
}
