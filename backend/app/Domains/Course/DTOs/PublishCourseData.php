<?php

namespace App\Domains\Course\DTOs;

class PublishCourseData
{
    public function __construct(
        public readonly string $status,
        public readonly ?string $publishAt = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            status: $data['status'],
            publishAt: $data['publish_at'] ?? null
        );
    }
}
