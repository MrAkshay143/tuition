<?php

namespace App\Domains\Media\Services;

use App\Domains\Course\Models\Lesson;
use DB;

class MediaLinkService
{
    /**
     * Link media files to a Lesson.
     */
    public function syncLessonLinks(Lesson $lesson, ?int $primaryId = null, ?int $downloadId = null, int $userId = 1)
    {
        DB::transaction(function () use ($lesson, $primaryId, $downloadId, $userId) {
            // Remove previous linkages for this lesson
            DB::table('media_links')
                ->where('entity_type', Lesson::class)
                ->where('entity_id', $lesson->id)
                ->delete();

            if ($primaryId) {
                DB::table('media_links')->insert([
                    'media_id'    => $primaryId,
                    'entity_type' => Lesson::class,
                    'entity_id'   => $lesson->id,
                    'link_type'   => 'primary',
                    'created_by'  => $userId,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }

            if ($downloadId) {
                DB::table('media_links')->insert([
                    'media_id'    => $downloadId,
                    'entity_type' => Lesson::class,
                    'entity_id'   => $lesson->id,
                    'link_type'   => 'download',
                    'created_by'  => $userId,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        });
    }

    /**
     * General function to link any entity (e.g. Course, Batch, Subject) to a media file.
     */
    public function linkEntity(int $mediaId, string $entityType, int $entityId, string $linkType = 'link', int $userId = 1)
    {
        DB::table('media_links')->updateOrInsert(
            [
                'media_id'    => $mediaId,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
            ],
            [
                'link_type'   => $linkType,
                'created_by'  => $userId,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]
        );
    }

    /**
     * General function to unlink any entity.
     */
    public function unlinkEntity(int $mediaId, string $entityType, int $entityId)
    {
        DB::table('media_links')
            ->where('media_id', $mediaId)
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->delete();
    }

    /**
     * Generate an expirable signed stream URL for private storage or Cloudflare R2 / S3 storage.
     */
    public function generateSignedStreamUrl(\App\Domains\Media\Models\Media $media, int $minutes = 60): string
    {
        // 1. If YouTube provider or YouTube URL, return the URL directly
        if ($media->provider === 'youtube' || (!empty($media->url) && (str_contains($media->url, 'youtube.com') || str_contains($media->url, 'youtu.be')))) {
            return $media->url;
        }

        $providerInstance = \App\Domains\Core\Providers\MediaProviderFactory::make($media->provider);$disk = $media->storage_driver ?: 'local';

        // 2. If storage file does not exist on local disk, fall back to media url or sample video
        if ($disk === 'local' && (empty($media->path) || !$providerInstance->exists($media->path))) {
            if (!empty($media->url)) {
                return $media->url;
            }
            return config('app.fallback_video_url', '');
        }

        if (in_array($disk, ['r2', 's3'])) {
            return $providerInstance->temporaryUrl(
                $media->path,
                now()->addMinutes($minutes)
            );
        }

        // Return signed temporary route to prevent public HLS exposure
        return \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'api.v1.media.stream',
            now()->addMinutes($minutes),
            ['media' => $media->id]
        );
    }
}
