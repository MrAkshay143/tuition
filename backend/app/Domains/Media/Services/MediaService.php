<?php

namespace App\Domains\Media\Services;

use App\Domains\Media\Models\Media;
use App\Domains\Media\Models\ContentCategory;
use App\Domains\Media\Models\ContentTag;
use App\Domains\Media\Repositories\MediaRepository;
use App\Models\ActivityLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    protected MediaRepository $mediaRepository;
    protected VideoProcessingService $videoProcessingService;

    public function __construct(MediaRepository $mediaRepository, VideoProcessingService $videoProcessingService)
    {
        $this->mediaRepository = $mediaRepository;
        $this->videoProcessingService = $videoProcessingService;
    }

    /**
    /**
     * Handle YouTube/Vimeo/External URL video import.
     */
    public function importYoutube(array $data, int $userId): Media
    {
        return DB::transaction(function () use ($data, $userId) {
            $url = $data['url'];
            $provider = 'external';
            $path = $url;
            $thumbnail = null;

            // YouTube detection
            $youtubeId = $this->extractYoutubeId($url);
            if ($youtubeId) {
                $provider = 'youtube';
                $path = $youtubeId;
                $thumbnail = "https://img.youtube.com/vi/{$youtubeId}/hqdefault.jpg";

                // Duplicate check for YouTube only
                $existing = $this->mediaRepository->findByYoutubeId($youtubeId);
                if ($existing) {
                    throw new \RuntimeException('duplicate_youtube');
                }
            } else {
                // Vimeo detection
                $vimeoId = $this->extractVimeoId($url);
                if ($vimeoId) {
                    $provider = 'vimeo';
                    $path = $vimeoId;
                    $thumbnail = "https://vumbnail.com/{$vimeoId}.jpg";
                }
            }

            $name = $data['title'] ?? ($provider === 'youtube' ? 'YouTube Video' : ($provider === 'vimeo' ? 'Vimeo Video' : 'External Video'));

            $media = $this->mediaRepository->create([
                'uuid' => (string) Str::uuid(),
                'name' => $name,
                'original_name' => $name,
                'provider' => $provider,
                'storage_driver' => 'local',
                'mime' => 'video/x-' . $provider,
                'extension' => $provider,
                'size' => 0,
                'duration' => $data['duration'] ?? null,
                'thumbnail' => $thumbnail,
                'processing_status' => 'ready',
                'visibility' => $data['visibility'] ?? 'published',
                'path' => $path,
                'filename' => $path,
                'mime_type' => 'video/x-' . $provider,
                'size_bytes' => 0,
                'uploaded_by' => $userId,
                'description' => $data['description'] ?? null,
                'type' => 'video',
                'category_id' => $data['category_id'] ?? null,
                'publish_at' => $data['publish_at'] ?? null,
            ]);

            // Sync tags
            if (!empty($data['tags'])) {
                $this->syncTags($media, $data['tags']);
            }

            // Sync direct linkages if requested
            if (!empty($data['link_entities'])) {
                $this->syncLinks($media, $data['link_entities'], $userId);
            }

            ActivityLog::record('media.import', "Imported {$provider} video: '{$media->name}'", [
                'media_id' => $media->id,
                'url' => $url,
            ]);

            return $media;
        });
    }

    /**
     * Handle local file upload.
     */
    public function uploadFile(UploadedFile $file, array $data, int $userId): Media
    {
        return DB::transaction(function () use ($file, $data, $userId) {
            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getClientMimeType();
            $size = $file->getSize();

            $providerInstance = \App\Domains\Core\Providers\MediaProviderFactory::make($data['provider'] ?? 'local');
            $uploadResult = $providerInstance->upload($file, 'uploads/media');

            $type = $this->determineMediaType($mimeType, $extension);
            $name = $data['title'] ?? pathinfo($originalName, PATHINFO_FILENAME);

            $duration = 0;
            $thumbnail = null;

            if ($type === 'video') {
                $metadata = $this->videoProcessingService->extractMetadata($file->getPathname());
                $duration = $metadata['duration'] ?? 0;
                
                $thumbnailLocalPath = $this->videoProcessingService->generateThumbnail($file->getPathname());
                if ($thumbnailLocalPath) {
                    if ($uploadResult['driver'] !== 'public' && $uploadResult['driver'] !== 'local') {
                        $content = Storage::disk('public')->get($thumbnailLocalPath);
                        $providerInstance->put($thumbnailLocalPath, $content);
                        Storage::disk('public')->delete($thumbnailLocalPath);
                    }
                    $thumbnail = $providerInstance->getUrl($thumbnailLocalPath);
                }
            }

            $media = $this->mediaRepository->create([
                'uuid' => (string) Str::uuid(),
                'name' => $name,
                'original_name' => $originalName,
                'provider' => $uploadResult['provider'],
                'storage_driver' => $uploadResult['driver'],
                'mime' => $mimeType,
                'extension' => $extension,
                'size' => $size,
                'duration' => $duration,
                'thumbnail' => $thumbnail,
                'processing_status' => 'ready',
                'visibility' => $data['visibility'] ?? 'published',
                'path' => $uploadResult['path'],
                'filename' => $originalName,
                'mime_type' => $mimeType,
                'size_bytes' => $size,
                'uploaded_by' => $userId,
                'description' => $data['description'] ?? null,
                'type' => $type,
                'category_id' => $data['category_id'] ?? null,
                'publish_at' => $data['publish_at'] ?? null,
            ]);

            // Sync tags
            if (!empty($data['tags'])) {
                $this->syncTags($media, $data['tags']);
            }

            // Sync direct linkages
            if (!empty($data['link_entities'])) {
                $this->syncLinks($media, $data['link_entities'], $userId);
            }

            if ($type === 'video') {
                $media->update(['processing_status' => 'queued']);
                \App\Domains\Media\Jobs\ProcessVideoMediaJob::dispatch($media);
            }

            ActivityLog::record('media.upload', "Uploaded media file: '{$media->name}'", [
                'media_id' => $media->id,
                'file_size' => $size,
            ]);

            return $media;
        });
    }

    /**
     * Replace file for existing media.
     */
    public function replaceFile(Media $media, UploadedFile $file, int $userId): Media
    {
        return DB::transaction(function () use ($media, $file, $userId) {
            $providerInstance = \App\Domains\Core\Providers\MediaProviderFactory::make($media->provider);

            // Delete old file using the provider
            if ($media->path && !in_array($media->provider, ['youtube', 'vimeo', 'external'])) {
                $providerInstance->delete($media->path);
            }

            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getClientMimeType();
            $size = $file->getSize();

            $uploadResult = $providerInstance->upload($file, 'uploads/media');

            $type = $this->determineMediaType($mimeType, $extension);

            $updateData = [
                'original_name' => $originalName,
                'mime' => $mimeType,
                'extension' => $extension,
                'size' => $size,
                'path' => $uploadResult['path'],
                'filename' => $originalName,
                'mime_type' => $mimeType,
                'size_bytes' => $size,
                'type' => $type,
                'storage_driver' => $uploadResult['driver'],
            ];

            if ($type === 'video') {
                $metadata = $this->videoProcessingService->extractMetadata($file->getPathname());
                $updateData['duration'] = $metadata['duration'] ?? 0;
                
                $thumbnailLocalPath = $this->videoProcessingService->generateThumbnail($file->getPathname());
                if ($thumbnailLocalPath) {
                    if ($uploadResult['driver'] !== 'public' && $uploadResult['driver'] !== 'local') {
                        $content = Storage::disk('public')->get($thumbnailLocalPath);
                        $providerInstance->put($thumbnailLocalPath, $content);
                        Storage::disk('public')->delete($thumbnailLocalPath);
                    }
                    $updateData['thumbnail'] = $providerInstance->getUrl($thumbnailLocalPath);
                }
            }

            $this->mediaRepository->update($media, $updateData);

            ActivityLog::record('media.replace', "Replaced media file for ID: {$media->id}", [
                'media_id' => $media->id,
                'new_size' => $size,
            ]);

            return $media;
        });
    }

    /**
     * Update media metadata.
     */
    public function updateMetadata(Media $media, array $data, int $userId): Media
    {
        return DB::transaction(function () use ($media, $data, $userId) {
            $this->mediaRepository->update($media, array_intersect_key($data, array_flip([
                'name', 'description', 'category_id', 'visibility', 'publish_at', 'status'
            ])));

            if (isset($data['tags'])) {
                $this->syncTags($media, $data['tags']);
            }

            ActivityLog::record('media.update', "Updated media details for: '{$media->name}'", [
                'media_id' => $media->id,
            ]);

            return $media;
        });
    }

    /**
     * Recycle Bin deletion (Soft delete).
     */
    public function softDelete(Media $media, int $userId): bool
    {
        return DB::transaction(function () use ($media, $userId) {
            $result = $this->mediaRepository->delete($media, false);

            ActivityLog::record('media.delete', "Moved media to recycle bin: '{$media->name}'", [
                'media_id' => $media->id,
            ]);

            return $result;
        });
    }

    /**
     * Restore from Recycle Bin.
     */
    public function restore(Media $media, int $userId): bool
    {
        return DB::transaction(function () use ($media, $userId) {
            $result = $this->mediaRepository->restore($media);

            ActivityLog::record('media.restore', "Restored media from recycle bin: '{$media->name}'", [
                'media_id' => $media->id,
            ]);

            return $result;
        });
    }

    /**
     * Force delete media.
     */
    public function forceDelete(Media $media, int $userId): bool
    {
        return DB::transaction(function () use ($media, $userId) {
            $providerInstance = \App\Domains\Core\Providers\MediaProviderFactory::make($media->provider);

            // Delete actual file using the provider
            if ($media->path && !in_array($media->provider, ['youtube', 'vimeo', 'external'])) {
                $providerInstance->delete($media->path);
            }

            $result = $this->mediaRepository->delete($media, true);

            ActivityLog::record('media.force_delete', "Permanently deleted media: '{$media->name}'", [
                'media_id' => $media->id,
            ]);

            return $result;
        });
    }

    /**
     * Sync tags.
     */
    protected function syncTags(Media $media, $tagsInput)
    {
        $tags = is_string($tagsInput) ? array_map('trim', explode(',', $tagsInput)) : $tagsInput;
        $tagIds = [];

        foreach ($tags as $tagName) {
            if (empty($tagName)) continue;
            $tag = ContentTag::firstOrCreate(['name' => $tagName]);
            $tagIds[] = $tag->id;
        }

        $media->tags()->sync($tagIds);
    }

    /**
     * Sync manual links from uploader.
     */
    protected function syncLinks(Media $media, array $linkEntities, int $userId)
    {
        foreach ($linkEntities as $entity) {
            if (empty($entity['type']) || empty($entity['id'])) continue;
            
            DB::table('media_links')->updateOrInsert(
                [
                    'media_id' => $media->id,
                    'entity_type' => $entity['type'],
                    'entity_id' => $entity['id'],
                ],
                [
                    'link_type' => $entity['link_type'] ?? 'link',
                    'created_by' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    /**
     * Helper to extract YouTube video ID.
     */
    protected function extractYoutubeId(string $url): ?string
    {
        if (preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/||user/[^/]+/u/\w{0,11}/)|youtu\.be/|youtube\.com/shorts/)([^"&?/\s]{11})%i', $url, $match)) {
            return $match[1];
        }
        return null;
    }

    /**
     * Helper to extract Vimeo video ID.
     */
    protected function extractVimeoId(string $url): ?string
    {
        if (preg_match('%(?:vimeo\.com/|player\.vimeo\.com/video/)([0-9]{9,})%i', $url, $match)) {
            return $match[1];
        }
        return null;
    }

    /**
     * Helper to determine media type from MIME/Extension.
     */
    protected function determineMediaType(string $mime, string $ext): string
    {
        if (str_starts_with($mime, 'video/') || in_array($ext, ['mp4', 'm4v', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mpeg'])) {
            return 'video';
        }
        if (str_starts_with($mime, 'image/') || in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'])) {
            return 'image';
        }
        if (str_starts_with($mime, 'audio/') || in_array($ext, ['mp3', 'wav', 'ogg', 'aac', 'm4a'])) {
            return 'audio';
        }
        if (in_array($mime, [
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'
        ]) || in_array($ext, ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'])) {
            return 'document';
        }
        if (in_array($ext, ['zip', 'rar', 'tar', 'gz', '7z'])) {
            return 'archive';
        }
        return 'other';
    }
}


