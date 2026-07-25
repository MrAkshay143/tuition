<?php

namespace App\Domains\Media\Repositories;

use App\Domains\Media\Models\Media;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class MediaRepository
{
    /**
     * Get paginated media items with filters.
     */
    public function getPaginated(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Media::query()->with(['category', 'tags', 'statistics']);

        // Soft deletes - include or only recycle bin
        if (isset($filters['only_trashed']) && $filters['only_trashed']) {
            $query->onlyTrashed();
        }

        // Filter by type (video, document, image, audio, archive, other)
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Filter by provider (local, youtube, etc.)
        if (!empty($filters['provider'])) {
            $query->where('provider', $filters['provider']);
        }

        // Filter by category
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Filter by visibility
        if (!empty($filters['visibility'])) {
            $query->where('visibility', $filters['visibility']);
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by uploaded_by (teacher)
        if (!empty($filters['uploaded_by'])) {
            $query->where('uploaded_by', $filters['uploaded_by']);
        }

        // Filter by linked / unlinked
        if (isset($filters['linked'])) {
            if ($filters['linked'] === 'true' || $filters['linked'] === true) {
                $query->whereHas('links');
            } elseif ($filters['linked'] === 'false' || $filters['linked'] === false) {
                $query->whereDoesntHave('links');
            }
        }

        // Search text (title, description, tags)
        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function (Builder $q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('original_name', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhereHas('tags', function ($tagQuery) use ($s) {
                      $tagQuery->where('name', 'like', "%{$s}%");
                  });
            });
        }

        // Filter by subject, batch, course, or lesson via media_links
        if (!empty($filters['course_id']) || !empty($filters['batch_id']) || !empty($filters['lesson_id']) || !empty($filters['subject_id'])) {
            $query->whereHas('links', function ($linkQuery) use ($filters) {
                $linkQuery->where(function ($subQuery) use ($filters) {
                    if (!empty($filters['course_id'])) {
                        $subQuery->orWhere(function ($q) use ($filters) {
                            $q->where('entity_type', 'App\Domains\Course\Models\Course')
                              ->where('entity_id', $filters['course_id']);
                        });
                    }
                    if (!empty($filters['batch_id'])) {
                        $subQuery->orWhere(function ($q) use ($filters) {
                            $q->where('entity_type', 'App\Domains\Core\Models\Batch')
                              ->where('entity_id', $filters['batch_id']);
                        });
                    }
                    if (!empty($filters['lesson_id'])) {
                        $subQuery->orWhere(function ($q) use ($filters) {
                            $q->where('entity_type', 'App\Domains\Course\Models\Lesson')
                              ->where('entity_id', $filters['lesson_id']);
                        });
                    }
                });
            });
        }

        // Order by display order or dates
        $orderBy = $filters['order_by'] ?? 'created_at';
        $direction = $filters['order_direction'] ?? 'desc';
        $query->orderBy($orderBy, $direction);

        return $query->paginate($perPage);
    }

    /**
     * Find media by ID (including trashed option).
     */
    public function findById(int $id, bool $includeTrashed = false): ?Media
    {
        $query = Media::query();
        if ($includeTrashed) {
            $query->withTrashed();
        }
        return $query->find($id);
    }

    /**
     * Find media by YouTube ID.
     */
    public function findByYoutubeId(string $youtubeId): ?Media
    {
        return Media::where('provider', 'youtube')
            ->where('path', $youtubeId)
            ->first();
    }

    /**
     * Find media by Checksum.
     */
    public function findByChecksum(string $checksum): ?Media
    {
        return Media::where('checksum', $checksum)->first();
    }

    /**
     * Create a new media record.
     */
    public function create(array $data): Media
    {
        return Media::create($data);
    }

    /**
     * Update a media record.
     */
    public function update(Media $media, array $data): bool
    {
        return $media->update($data);
    }

    /**
     * Delete a media record (soft or hard).
     */
    public function delete(Media $media, bool $force = false): bool
    {
        if ($force) {
            return $media->forceDelete();
        }
        return $media->delete();
    }

    /**
     * Restore a soft-deleted media record.
     */
    public function restore(Media $media): bool
    {
        return $media->restore();
    }
}

