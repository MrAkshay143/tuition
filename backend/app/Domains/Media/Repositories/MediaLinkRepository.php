<?php

namespace App\Domains\Media\Repositories;

use App\Domains\Media\Models\MediaLink;
use Illuminate\Support\Collection;

class MediaLinkRepository
{
    /**
     * Get all links for a media item.
     */
    public function getLinksByMediaId(int $mediaId): Collection
    {
        return MediaLink::where('media_id', $mediaId)
            ->with(['creator'])
            ->get();
    }

    /**
     * Add link association to media.
     */
    public function createLink(array $data): MediaLink
    {
        return MediaLink::create($data);
    }

    /**
     * Remove link association.
     */
    public function deleteLink(int $linkId): bool
    {
        return (bool) MediaLink::destroy($linkId);
    }

    /**
     * Delete links by entity.
     */
    public function deleteByEntity(string $entityType, int $entityId): int
    {
        return MediaLink::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->delete();
    }
}
