<?php

namespace App\Domains\Media\Services;

use App\Domains\Media\Models\Media;
use App\Domains\Media\Jobs\ProcessVideoJob;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class MediaPipelineService
{
    /**
     * Execute full media processing pipeline.
     */
    public function process(UploadedFile $file, int $uploadedBy, ?string $customType = null): Media
    {
        $mime = $file->getMimeType();
        $ext = strtolower($file->getClientOriginalExtension());
        $size = $file->getSize();
        $isVideo = str_starts_with($mime, 'video/');

        // 1. Validation & Storage
        $dir = $isVideo ? 'videos' : 'documents';
        $path = $file->store($dir, 'public');
        $checksum = md5_file($file->path());

        // 2. Persistence
        $media = Media::create([
            'name'              => $file->getClientOriginalName(),
            'original_name'     => $file->getClientOriginalName(),
            'provider'          => 'local',
            'storage_driver'    => 'public',
            'mime'              => $mime,
            'extension'         => $ext,
            'size'              => $size,
            'size_bytes'        => $size,
            'path'              => $path,
            'filename'          => $file->getClientOriginalName(),
            'mime_type'         => $mime,
            'uploaded_by'       => $uploadedBy,
            'processing_status' => $isVideo ? 'queued' : 'ready',
            'visibility'        => 'private',
            'checksum'          => $checksum,
        ]);

        // 3. Transcode & Async Job Dispatch
        if ($isVideo) {
            ProcessVideoJob::dispatch($media);
        }

        return $media;
    }
}
