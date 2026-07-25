<?php

namespace App\Domains\Media\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Storage;

class CleanupMediaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $orphaned = Media::where('processing_status', 'failed')
            ->where('created_at', '<', now()->subDays(7))
            ->get();

        foreach ($orphaned as $item) {
            if ($item->path) {
                Storage::disk('public')->delete($item->path);
            }
            $item->delete();
        }
    }
}
