<?php

namespace App\Domains\Media\ValueObjects;

class VideoMetadata
{
    public function __construct(
        public readonly int $durationSeconds,
        public readonly ?string $thumbnailUrl = null,
        public readonly string $videoProvider = 'youtube',
        public readonly ?string $resolution = null,
        public readonly ?int $sizeBytes = null
    ) {}

    /**
     * Convert metadata to array representation.
     */
    public function toArray(): array
    {
        return [
            'duration_seconds' => $this->durationSeconds,
            'thumbnail_url'    => $this->thumbnailUrl,
            'video_provider'   => $this->videoProvider,
            'resolution'       => $this->resolution,
            'size_bytes'       => $this->sizeBytes,
        ];
    }
}
