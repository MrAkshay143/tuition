<?php

namespace App\Domains\Media\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Illuminate\Support\Str;

class VideoProcessingService
{
    /**
     * Extract video metadata using ffprobe.
     *
     * @param string $absolutePath
     * @return array
     */
    public function extractMetadata(string $absolutePath): array
    {
        $process = new Process([
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,duration',
            '-of', 'json',
            $absolutePath
        ]);

        $process->setTimeout(60);
        $process->run();

        if (!$process->isSuccessful()) {
            Log::error('FFprobe failed: ' . $process->getErrorOutput());
            return [
                'width' => null,
                'height' => null,
                'duration' => 0,
            ];
        }

        $output = json_decode($process->getOutput(), true);
        $stream = $output['streams'][0] ?? [];

        return [
            'width' => $stream['width'] ?? null,
            'height' => $stream['height'] ?? null,
            'duration' => isset($stream['duration']) ? (int) round((float)$stream['duration']) : 0,
        ];
    }

    /**
     * Generate a thumbnail from the video using ffmpeg.
     *
     * @param string $absolutePath
     * @param string $outputDirectory
     * @return string|null Relative path to the thumbnail on the public disk.
     */
    public function generateThumbnail(string $absolutePath, string $outputDirectory = 'uploads/thumbnails'): ?string
    {
        if (!\App\Domains\Core\Providers\MediaProviderFactory::make('local')->exists($outputDirectory)) {
            \App\Domains\Core\Providers\MediaProviderFactory::make('local')->makeDirectory($outputDirectory);
        }

        $filename = Str::random(40) . '.jpg';
        $outputPath = \App\Domains\Core\Providers\MediaProviderFactory::make('local')->path($outputDirectory . '/' . $filename);

        $process = new Process([
            'ffmpeg',
            '-y',
            '-i', $absolutePath,
            '-ss', '00:00:01.000',
            '-vframes', '1',
            $outputPath
        ]);

        $process->setTimeout(120);
        $process->run();

        if (!$process->isSuccessful()) {
            Log::error('FFmpeg thumbnail generation failed: ' . $process->getErrorOutput());
            return null;
        }

        return $outputDirectory . '/' . $filename;
    }

    /**
     * Transcode video to HLS format.
     *
     * @param string $absolutePath
     * @param string $outputPath
     * @param string $outputFolder
     * @return bool
     */
    public function transcodeToHLS(string $absolutePath, string $outputPath, string $outputFolder): bool
    {
        if (!is_dir($outputFolder)) {
            mkdir($outputFolder, 0755, true);
        }

        $process = new Process([
            'ffmpeg',
            '-y',
            '-i', $absolutePath,
            '-profile:v', 'baseline',
            '-level', '3.0',
            '-s', '640x360',
            '-start_number', '0',
            '-hls_time', '10',
            '-hls_list_size', '0',
            '-f', 'hls',
            $outputPath
        ]);

        $process->setTimeout(7200);
        $process->run();

        if (!$process->isSuccessful()) {
            Log::error('FFmpeg HLS transcoding failed: ' . $process->getErrorOutput());
            return false;
        }

        return true;
    }
}

