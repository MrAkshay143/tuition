<?php

namespace App\Domains\Course\DTOs;

use App\Domains\Course\Enums\CourseStatus;

class CreateCourseDTO
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $description = null,
        public readonly ?string $thumbnail = null,
        public readonly int $teacherId = 1,
        public readonly CourseStatus $status = CourseStatus::DRAFT,
        public readonly int $sortOrder = 0,
        public readonly ?string $publishAt = null,
        public readonly ?string $unpublishAt = null,
        public readonly ?string $timezone = null,
        public readonly ?int $programId = null,
        public readonly ?int $subjectId = null,
        public readonly array $batchIds = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            title:       $data['title'],
            description: $data['description'] ?? null,
            thumbnail:   $data['thumbnail'] ?? null,
            teacherId:   $data['teacher_id'] ?? 1,
            status:      isset($data['status']) ? CourseStatus::from($data['status']) : CourseStatus::DRAFT,
            sortOrder:   $data['sort_order'] ?? 0,
            publishAt:   $data['publish_at'] ?? null,
            unpublishAt: $data['unpublish_at'] ?? null,
            timezone:    $data['timezone'] ?? null,
            programId:   isset($data['program_id']) ? (int) $data['program_id'] : null,
            subjectId:   isset($data['subject_id']) ? (int) $data['subject_id'] : null,
            batchIds:    $data['batch_ids'] ?? [],
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'title'        => $this->title,
            'description'  => $this->description,
            'thumbnail'    => $this->thumbnail,
            'teacher_id'   => $this->teacherId,
            'status'       => $this->status->value,
            'sort_order'   => $this->sortOrder,
            'publish_at'   => $this->publishAt,
            'unpublish_at' => $this->unpublishAt,
            'timezone'     => $this->timezone,
            'program_id'   => $this->programId,
            'subject_id'   => $this->subjectId,
        ], fn($v) => $v !== null);
    }
}
