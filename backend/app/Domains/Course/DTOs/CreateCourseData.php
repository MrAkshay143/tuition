<?php

namespace App\Domains\Course\DTOs;

class CreateCourseData
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $description = null,
        public readonly ?string $thumbnail = null,
        public readonly ?string $status = 'draft',
        public readonly ?int $sortOrder = 0,
        public readonly ?int $teacherId = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'],
            description: $data['description'] ?? null,
            thumbnail: $data['thumbnail'] ?? null,
            status: $data['status'] ?? 'draft',
            sortOrder: $data['sort_order'] ?? 0,
            teacherId: $data['teacher_id'] ?? null
        );
    }
}
