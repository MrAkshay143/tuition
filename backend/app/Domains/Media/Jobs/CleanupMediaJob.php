<?php

namespace App\Domains\Media\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Media\Models\Media;

class CleanupMediaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $orphaned = Media::where('processing_status', 'failed')
            ->where('created_at', '<', now()->subDays(7))
            ->get();

        foreach ($orphaned as $item) {
            if ($item->path && !in_array($item->provider, ['youtube', 'vimeo', 'external'])) {
                $providerInstance = \App\Domains\Core\Providers\MediaProviderFactory::make($item->provider);
                $providerInstance->delete($item->path);
            }
            $item->delete();
        }
    }
}
