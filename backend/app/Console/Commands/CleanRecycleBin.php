<?php

namespace App\Console\Commands;

use App\Domains\Media\Models\Media;
use App\Domains\Media\Services\MediaService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:clean-recycle-bin')]
#[Description('Permanently delete media items in the recycle bin older than the configured retention days')]
class CleanRecycleBin extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(MediaService $mediaService)
    {
        $days = config('media.recycle_bin_retention_days', 30);
        $threshold = now()->subDays($days);

        $expiredMedia = Media::onlyTrashed()
            ->where('deleted_at', '<', $threshold)
            ->get();

        $count = 0;
        foreach ($expiredMedia as $media) {
            $mediaService->forceDelete($media, 1);
            $count++;
        }

        $this->info("Successfully purged {$count} expired media items from the Recycle Bin.");
    }
}
