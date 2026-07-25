<?php

namespace App\Domains\Course\DTOs;

class UpdateCourseData
{
    public function __construct(
        public readonly ?string $title = null,
        public readonly ?string $description = null,
        public readonly ?string $thumbnail = null,
        public readonly ?string $status = null,
        public readonly ?int $sortOrder = null,
        public readonly ?int $teacherId = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'] ?? null,
            description: $data['description'] ?? null,
            thumbnail: $data['thumbnail'] ?? null,
            status: $data['status'] ?? null,
            sortOrder: $data['sort_order'] ?? null,
            teacherId: $data['teacher_id'] ?? null
        );
    }
}
