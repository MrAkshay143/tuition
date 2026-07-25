<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Media\Models\Media;
use App\Domains\Media\Repositories\MediaRepository;
use App\Domains\Media\Services\MediaService;
use App\Http\Requests\V1\UploadMediaRequest;
use App\Http\Requests\V1\ImportYoutubeRequest;
use App\Http\Requests\V1\ReplaceMediaRequest;
use App\Http\Requests\V1\LinkMediaRequest;
use App\Http\Resources\V1\MediaResource;
use App\Http\Resources\V1\MediaUsageResource;
use App\Http\Resources\V1\PaginatedResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class MediaController extends \App\Http\Controllers\ApiController
{
    public function __construct(
        protected \App\Domains\Media\Repositories\MediaRepository $mediaRepository,
        protected \App\Domains\Media\Services\MediaService $mediaService
    ) {}

    public function index(
        \App\Domains\Media\Requests\GetMediaRequest $request,
        \App\Domains\Media\Actions\GetMediaAction $action
    ): JsonResponse {
        $filters = $request->only([
            'type', 'provider', 'category_id', 'visibility', 'status', 'uploaded_by', 'linked', 'search',
            'course_id', 'batch_id', 'lesson_id', 'subject_id', 'only_trashed', 'order_by', 'order_direction'
        ]);

        if ($request->user()?->isStudent()) {
            $filters['visibility'] = 'published';
            unset($filters['status']);
        }

        $perPage = $request->query('per_page', 15);
        $media = $action->execute($filters, $perPage);

        return (new PaginatedResource($media))->toResponse($request);
    }

    public function show(
        \App\Domains\Media\Requests\GetMediaItemRequest $request,
        int $id
    ): JsonResponse {
        $media = $this->mediaRepository->findById($id, true);
        return $this->success(new MediaResource($media), 'Media item retrieved successfully.');
    }

    public function upload(
        \App\Domains\Media\Requests\StoreMediaRequest $request,
        \App\Domains\Media\Actions\StoreMediaAction $action
    ): JsonResponse {
        $file = $request->file('file');
        $data = $request->validated();
        $userId = $request->user()?->id ?? 1;

        $media = $action->execute($file, $data, $userId);

        return $this->success(new MediaResource($media), 'Media file uploaded successfully.', 201);
    }

    public function youtube(
        \App\Domains\Media\Requests\ImportYoutubeRequest $request,
        \App\Domains\Media\Actions\ImportYoutubeAction $action
    ): JsonResponse {
        try {
            $data = $request->validated();
            $userId = $request->user()?->id ?? 1;
            
            $media = $action->execute($data, $userId);
            
            return $this->success(new MediaResource($media), 'Video imported successfully.', 201);
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'duplicate_youtube') {
                return $this->error('This YouTube video has already been imported.', 422);
            }
            return $this->error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function update(
        \App\Domains\Media\Requests\UpdateMediaRequest $request,
        \App\Domains\Media\Actions\UpdateMediaAction $action,
        int $id
    ): JsonResponse {
        $media = $this->mediaRepository->findById($id);
        $data = $request->validated();
        $userId = $request->user()?->id ?? 1;

        $media = $action->execute($media, $data, $userId);

        return $this->success(new MediaResource($media), 'Media item updated successfully.');
    }

    public function replace(
        \App\Domains\Media\Requests\ReplaceMediaRequest $request,
        \App\Domains\Media\Actions\ReplaceMediaAction $action,
        int $id
    ): JsonResponse {
        $media = $this->mediaRepository->findById($id);
        $file = $request->file('file');
        $userId = $request->user()?->id ?? 1;

        $media = $action->execute($media, $file, $userId);

        return $this->success(new MediaResource($media), 'Media file replaced successfully.');
    }

    public function destroy(
        \App\Domains\Media\Requests\DeleteMediaRequest $request,
        \App\Domains\Media\Actions\DeleteMediaAction $action,
        int $id
    ): JsonResponse {
        $media = $this->mediaRepository->findById($id);

        $force = $request->query('force') === 'true';
        $linksCount = $media->links()->count();

        if ($linksCount > 0 && !$force) {
            return $this->error("Cannot delete media. It is currently referenced in the system.", 422);
        }

        $userId = $request->user()?->id ?? 1;
        $action->execute($media, $force, $userId);

        $message = $force ? 'Media item permanently deleted.' : 'Media item moved to recycle bin.';
        return $this->success(null, $message);
    }

    public function usage(int $id): JsonResponse
    {
        $media = $this->mediaRepository->findById($id, true);
        if (!$media) {
            return $this->error('Media not found', 404);
        }

        $links = $media->links()->get();

        return $this->success([
            'count' => $links->count(),
            'used_by' => MediaUsageResource::collection($links)
        ], 'Media usage retrieved successfully.');
    }

    /**
     * GET /api/v1/media/recycle-bin
     */
    public function recycleBin(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'type']);
        $filters['only_trashed'] = true;

        $perPage = $request->query('per_page', 15);
        $media = $this->mediaRepository->getPaginated($filters, $perPage);

        return (new PaginatedResource($media))->toResponse($request);
    }

    /**
     * POST /api/v1/media/{id}/restore
     */
    public function restore(int $id): JsonResponse
    {
        $media = $this->mediaRepository->findById($id, true);
        if (!$media) {
            return $this->error('Media not found', 404);
        }

        if (Gate::denies('restore', $media)) {
            return $this->error('Unauthorized to restore this media', 403);
        }

        $userId = auth()->id() ?? 1;
        $this->mediaService->restore($media, $userId);

        return $this->success(new MediaResource($media), 'Media item restored successfully.');
    }

    /**
     * POST /api/v1/media/bulk-delete
     */
    public function bulkDelete(\App\Domains\Media\Requests\BulkMediaRequest $request): JsonResponse { 
        $ids = $request->input('ids');
        $userId = $request->user()?->id ?? 1;
        $force = $request->query('force') === 'true';

        $count = 0;
        foreach ($ids as $id) {
            $media = $this->mediaRepository->findById($id, true);
            if ($media && Gate::allows('delete', $media)) {
                if ($force) {
                    $this->mediaService->forceDelete($media, $userId);
                } else {
                    $this->mediaService->softDelete($media, $userId);
                }
                $count++;
            }
        }

        return $this->success(null, "Successfully processed {$count} items.");
    }

    /**
     * POST /api/v1/media/bulk-publish
     */
    public function bulkPublish(\App\Domains\Media\Requests\BulkMediaRequest $request): JsonResponse { 
        $ids = $request->input('ids');

        $count = 0;
        foreach ($ids as $id) {
            $media = $this->mediaRepository->findById($id);
            if ($media && Gate::allows('update', $media)) {
                $media->update(['status' => 'published', 'visibility' => 'published']);
                $count++;
            }
        }

        return $this->success(null, "Successfully published {$count} items.");
    }

    /**
     * POST /api/v1/media/bulk-archive
     */
    public function bulkArchive(\App\Domains\Media\Requests\BulkMediaRequest $request): JsonResponse { 
        $ids = $request->input('ids');

        $count = 0;
        foreach ($ids as $id) {
            $media = $this->mediaRepository->findById($id);
            if ($media && Gate::allows('update', $media)) {
                $media->update(['status' => 'archived', 'visibility' => 'private']);
                $count++;
            }
        }

        return $this->success(null, "Successfully archived {$count} items.");
    }

    /**
     * POST /api/v1/media/bulk-category
     */
    public function bulkCategory(\App\Domains\Media\Requests\BulkCategoryMediaRequest $request): JsonResponse { 
        $ids = $request->input('ids');
        $categoryId = $request->input('category_id');

        $count = 0;
        foreach ($ids as $id) {
            $media = $this->mediaRepository->findById($id);
            if ($media && Gate::allows('update', $media)) {
                $media->update(['category_id' => $categoryId]);
                $count++;
            }
        }

        return $this->success(null, "Successfully updated category for {$count} items.");
    }

    /**
     * GET /api/v1/media/{id}/stream-url
     * Generates an expirable signed stream URL for admins to preview media.
     */
    public function streamUrl(Request $request, int $id)
    {
        $media = Media::find($id);
        if (!$media) {
            return response()->json(['message' => 'Media file not found.'], 404);
        }

        $linkService = app(\App\Domains\Media\Services\MediaLinkService::class);
        $signedUrl = $linkService->generateSignedStreamUrl($media, 60);

        return $this->success([
            'stream_url' => $signedUrl,
            'expires_at' => now()->addMinutes(60)->toIso8601String(),
        ], 'Stream URL generated successfully');
    }

    /**
     * GET /api/v1/media/{id}/stream
     * Secure private stream endpoint protected by signed URL signature & enrollment authorization.
     */
    public function stream(Request $request, int $id, string $segment = null)
    {
        if (!$request->hasValidSignature()) {
            return response()->json(['message' => 'Invalid or expired stream signature.'], 403);
        }

        $media = Media::find($id);
        if (!$media) {
            return response()->json(['message' => 'Media file not found.'], 404);
        }

        // Check enrollment / view permissions if media is linked to a lesson
        $lessonLink = \Illuminate\Support\Facades\DB::table('media_links')
            ->where('media_id', $media->id)
            ->where('entity_type', \App\Domains\Course\Models\Lesson::class)
            ->first();

        if ($lessonLink) {
            $lesson = \App\Domains\Course\Models\Lesson::find($lessonLink->entity_id);
            if ($lesson && !$lesson->is_free_preview) {
                $course = $lesson->chapter?->module?->course;
                if ($course && $request->user()) {
                    if (\Illuminate\Support\Facades\Gate::denies('viewLesson', $course)) {
                        return response()->json(['message' => 'Unauthorized: Active course enrollment required.'], 403);
                    }
                }
            }
        }

        $disk = $media->storage_driver ?: 'local';
        
        // If segment is null, serve the m3u8 playlist with rewritten absolute signed URLs
        if (!$segment) {
            $path = $media->path; // e.g. hls/1/playlist.m3u8
            if (!\Illuminate\Support\Facades\Storage::disk($disk)->exists($path)) {
                return response()->json(['message' => 'Private media stream asset not found.'], 404);
            }

            // If it's not an m3u8 playlist, just return the file (e.g. raw mp4)
            if (!str_ends_with($path, '.m3u8')) {
                return \Illuminate\Support\Facades\Storage::disk($disk)->response($path);
            }

            $content = \Illuminate\Support\Facades\Storage::disk($disk)->get($path);
            
            // Rewrite .ts lines to be full signed URLs
            $content = preg_replace_callback('/^(.*\.ts)$/m', function ($matches) use ($media, $request) {
                $seg = $matches[1];
                // Generate a signed URL for this specific segment, keeping the same expiration
                $expires = $request->query('expires') ? \Carbon\Carbon::createFromTimestamp($request->query('expires')) : now()->addMinutes(60);
                return \Illuminate\Support\Facades\URL::temporarySignedRoute(
                    'api.v1.media.stream',
                    $expires,
                    ['media' => $media->id, 'segment' => $seg]
                );
            }, $content);
            
            return response($content, 200, ['Content-Type' => 'application/vnd.apple.mpegurl']);
        }
        
        // If segment is provided, serve the TS file
        $hlsFolder = dirname($media->path);
        $segmentPath = "{$hlsFolder}/{$segment}";
        
        if (!\Illuminate\Support\Facades\Storage::disk($disk)->exists($segmentPath)) {
            return response()->json(['message' => 'Segment not found.'], 404);
        }
        
        return \Illuminate\Support\Facades\Storage::disk($disk)->response($segmentPath);
    }
}

