<?php

namespace App\Domains\Learning\DTOs;

class UpdateProgressData
{
    public function __construct(
        public readonly int $watchedSeconds,
        public readonly ?bool $completed = false
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            watchedSeconds: (int)$data['watched_seconds'],
            completed: (bool)($data['completed'] ?? false)
        );
    }
}
