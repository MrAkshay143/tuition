<?php

namespace App\Domains\Media\Jobs;

use App\Domains\Media\Models\Media;
use App\Domains\Media\Services\VideoProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessVideoMediaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $media;
    
    public $timeout = 7200;
    public $tries = 2;

    public function __construct(Media $media)
    {
        $this->media = $media;
        $this->onQueue('videos');
    }

    public function handle(VideoProcessingService $videoProcessingService): void
    {
        Log::info("ProcessVideoMediaJob started for media ID: {$this->media->id}");
        
        $this->media->update(['processing_status' => 'processing']);

        $disk = $this->media->storage_driver ?? 'local';
        $providerInstance = \App\Domains\Core\Providers\MediaProviderFactory::make($this->media->provider);

        if ($disk === 'local' || $disk === 'public') {
            $rawPath = $providerInstance->path($this->media->path);
        } else {
            // For cloud storage, generate a temporary URL for FFmpeg to read
            $rawPath = $providerInstance->temporaryUrl($this->media->path, now()->addHours(2));
        }
        
        $hlsFolder = "hls/{$this->media->id}";
        $playlistPath = "{$hlsFolder}/playlist.m3u8";
        
        // Always generate HLS locally first
        $localPlaylistPath = Storage::disk('public')->path($playlistPath);
        $localHlsFolder = Storage::disk('public')->path($hlsFolder);
        
        $hlsGenerated = $videoProcessingService->transcodeToHLS($rawPath, $localPlaylistPath, $localHlsFolder);

        if ($hlsGenerated) {
            $finalDisk = $disk;
            
            // If the original disk is a cloud provider, upload the HLS folder there
            if ($disk !== 'local' && $disk !== 'public') {
                $files = Storage::disk('public')->allFiles($hlsFolder);
                foreach ($files as $file) {
                    $content = Storage::disk('public')->get($file);
                    $providerInstance->put($file, $content);
                }
                // Cleanup local temp
                Storage::disk('public')->deleteDirectory($hlsFolder);
            } else {
                $finalDisk = 'public';
            }

            $this->media->update([
                'path'              => $playlistPath,
                'storage_driver'    => $finalDisk, 
                'processing_status' => 'ready',
                'resolution'        => '1280x720', // Default or extracted
            ]);
        } else {
            // Keep original MP4 if HLS fails, but mark ready
            $this->media->update([
                'processing_status' => 'ready',
            ]);
        }

        Log::info("ProcessVideoMediaJob completed successfully for media ID: {$this->media->id}");
    }
}
