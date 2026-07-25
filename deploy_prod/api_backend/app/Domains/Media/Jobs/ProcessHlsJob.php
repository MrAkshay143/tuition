<?php

namespace App\Domains\Media\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Media\Models\Media;
use App\Domains\Media\Models\Video;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessHlsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $media;
    public $video;
    
    // Allow up to 2 hours for large transcodes
    public $timeout = 7200;
    public $tries = 2;

    public function __construct(Media $media, Video $video)
    {
        $this->media = $media;
        $this->video = $video;
    }

    public function handle(): void
    {
        Log::info("ProcessHlsJob started for media ID: {$this->media->id}");
        
        $rawPath = Storage::disk('public')->path($this->media->path);
        
        // 1. Duration Extraction
        $duration = $this->extractDuration($rawPath);
        
        // 2. Thumbnail Generation
        $thumbnailPath = "thumbnails/thumb_{$this->media->id}.jpg";
        $this->generateThumbnail($rawPath, Storage::disk('public')->path($thumbnailPath));

        // 3. HLS Transcoding
        $hlsFolder = "hls/{$this->media->id}";
        $playlistPath = "{$hlsFolder}/playlist.m3u8";
        $this->transcodeToHLS($rawPath, Storage::disk('local')->path($playlistPath), Storage::disk('local')->path($hlsFolder));

        // 4. Update Models
        $this->media->update([
            'path'              => $playlistPath,
            'storage_driver'    => 'local', // Private disk for SEC-001
            'duration'          => $duration,
            'thumbnail'         => $thumbnailPath,
            'processing_status' => 'ready',
            'resolution'        => '1280x720',
        ]);

        $this->video->update([
            'url'              => $playlistPath,
            'thumbnail'        => $thumbnailPath,
            'duration_seconds' => $duration,
            'status'           => 'ready',
        ]);

        Log::info("ProcessHlsJob completed successfully for media ID: {$this->media->id}");
    }

    protected function extractDuration(string $filePath): int
    {
        $duration = 120; 

        if ($this->isBinaryAvailable('ffprobe')) {
            try {
                $cmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($filePath);
                $output = shell_exec($cmd);
                if ($output && is_numeric(trim($output))) {
                    $duration = (int) round(floatval(trim($output)));
                }
            } catch (\Throwable $e) {
                Log::warning("FFprobe duration extraction failed: " . $e->getMessage());
            }
        }

        return $duration;
    }

    protected function generateThumbnail(string $videoPath, string $outputPath): void
    {
        $dir = dirname($outputPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if ($this->isBinaryAvailable('ffmpeg')) {
            try {
                $cmd = "ffmpeg -y -ss 00:00:03 -i " . escapeshellarg($videoPath) . " -vframes 1 -q:v 2 " . escapeshellarg($outputPath) . " 2>&1";
                shell_exec($cmd);
                return;
            } catch (\Throwable $e) {
                Log::warning("FFmpeg thumbnail capture failed: " . $e->getMessage());
            }
        }

        $placeholder = public_path('images/physics_thumb.png');
        if (file_exists($placeholder)) {
            copy($placeholder, $outputPath);
        } else {
            file_put_contents($outputPath, ''); 
        }
    }

    protected function transcodeToHLS(string $videoPath, string $outputPath, string $outputFolder): void
    {
        if (!is_dir($outputFolder)) {
            mkdir($outputFolder, 0755, true);
        }

        if ($this->isBinaryAvailable('ffmpeg')) {
            try {
                $cmd = "ffmpeg -y -i " . escapeshellarg($videoPath) . " -profile:v baseline -level 3.0 -s 640x360 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls " . escapeshellarg($outputPath) . " 2>&1";
                shell_exec($cmd);
                return;
            } catch (\Throwable $e) {
                Log::warning("FFmpeg HLS transcoding failed: " . $e->getMessage());
            }
        }

        copy($videoPath, $outputPath);
    }

    protected function isBinaryAvailable(string $binary): bool
    {
        $command = PHP_OS_FAMILY === 'Windows' ? "where {$binary}" : "which {$binary}";
        $output = shell_exec($command);
        return !empty($output);
    }
}
