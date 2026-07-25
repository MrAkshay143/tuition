<?php

namespace App\Domains\Media\Services;

use App\Domains\Media\Models\Media;
use App\Domains\Media\Models\Video;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class VideoPipelineService
{
    /**
     * Process an uploaded raw video file through the pipeline.
     */
    public function process(Media $media): Video
    {
        Log::info("Starting video pipeline for media ID: {$media->id}");
        
        $media->update(['processing_status' => 'processing']);

        $thumbnailPath = "thumbnails/thumb_{$media->id}.jpg";
        $playlistPath = "hls/{$media->id}/playlist.m3u8";

        // Database registration
        $video = Video::create([
            'uploaded_by'      => $media->uploaded_by,
            'title'            => str_replace(['.mp4', '.mov', '.avi', '.webm', '.mkv'], '', $media->name),
            'description'      => 'Centralized media upload.',
            'url'              => $playlistPath,
            'thumbnail'        => $thumbnailPath,
            'provider'         => 'upload',
            'duration_seconds' => 0,
            'file_size_bytes'  => $media->size ?: $media->size_bytes,
            'status'           => 'processing',
            'is_public'        => false,
        ]);

        \App\Domains\Media\Jobs\ProcessHlsJob::dispatch($media, $video);

        Log::info("ProcessHlsJob dispatched for Video ID: {$video->id}");

        return $video;
    }
}
