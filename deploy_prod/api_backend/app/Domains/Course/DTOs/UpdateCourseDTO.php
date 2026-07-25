<?php

namespace App\Domains\Course\DTOs;

use App\Domains\Course\Enums\CourseStatus;

class UpdateCourseDTO
{
    public function __construct(
        public readonly ?string $title = null,
        public readonly ?string $description = null,
        public readonly ?string $thumbnail = null,
        public readonly ?CourseStatus $status = null,
        public readonly ?int $sortOrder = null,
        public readonly ?string $publishAt = null,
        public readonly ?string $unpublishAt = null,
        public readonly ?string $timezone = null,
        public readonly ?string $lastUpdatedAt = null,
        public readonly ?int $teacherId = null,
        public readonly ?int $programId = null,
        public readonly ?int $subjectId = null,
        public readonly ?array $batchIds = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            title:         $data['title'] ?? null,
            description:   $data['description'] ?? null,
            thumbnail:     $data['thumbnail'] ?? null,
            status:        isset($data['status']) ? CourseStatus::from($data['status']) : null,
            sortOrder:     $data['sort_order'] ?? null,
            publishAt:     $data['publish_at'] ?? null,
            unpublishAt:   $data['unpublish_at'] ?? null,
            timezone:      $data['timezone'] ?? null,
            lastUpdatedAt: $data['last_updated_at'] ?? null,
            teacherId:     $data['teacher_id'] ?? null,
            programId:     isset($data['program_id']) ? (int) $data['program_id'] : null,
            subjectId:     isset($data['subject_id']) ? (int) $data['subject_id'] : null,
            batchIds:      $data['batch_ids'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'title'        => $this->title,
            'description'  => $this->description,
            'thumbnail'    => $this->thumbnail,
            'status'       => $this->status?->value,
            'sort_order'   => $this->sortOrder,
            'publish_at'   => $this->publishAt,
            'unpublish_at' => $this->unpublishAt,
            'timezone'     => $this->timezone,
            'teacher_id'   => $this->teacherId,
            'program_id'   => $this->programId,
            'subject_id'   => $this->subjectId,
        ], fn($val) => !is_null($val));
    }
}
