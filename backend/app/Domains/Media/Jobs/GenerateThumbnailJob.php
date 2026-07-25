<?php

namespace App\Domains\Media\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Media\Models\Media;

class GenerateThumbnailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public Media $media) {}

    public function handle(): void
    {
        // Asynchronously extract video frame thumbnail
        app(\App\Domains\Media\Services\VideoPipelineService::class)->process($this->media);
    }
}
