<?php

namespace App\Domains\Media\Jobs;

use App\Domains\Media\Models\Media;
use App\Domains\Media\Services\VideoPipelineService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Exponential backoff delays in seconds between retry attempts.
     */
    public array $backoff = [30, 60, 120];

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 600;

    protected Media $media;

    public function __construct(Media $media)
    {
        $this->media = $media;
        
        // Target specifically the 'videos' queue
        $this->onQueue('videos');
    }

    /**
     * Execute the job.
     */
    public function handle(VideoPipelineService $pipeline): void
    {
        Log::info("ProcessVideoJob executing for media ID: {$this->media->id}");
        
        // Update status to processing
        $this->media->update(['processing_status' => 'processing']);

        try {
            $pipeline->process($this->media);
            $this->media->update(['processing_status' => 'ready']);
        } catch (\Throwable $e) {
            Log::error("ProcessVideoJob attempt failed for media ID: {$this->media->id}. Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Handle job permanent failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("ProcessVideoJob permanently failed for media ID: {$this->media->id}. Error: " . $exception->getMessage());
        $this->media->update(['processing_status' => 'failed']);
    }
}
