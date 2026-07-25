<?php

namespace App\Domains\Learning\DTOs;

class BookmarkData
{
    public function __construct(
        public readonly string $note,
        public readonly int $watchedSeconds
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            note: $data['note'] ?? '',
            watchedSeconds: (int)($data['watched_seconds'] ?? 0)
        );
    }
}
