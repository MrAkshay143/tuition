<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Domains\Media\Models\Media;

class CleanOrphanedMediaCommand extends Command
{
    protected $signature = 'media:clean-orphaned {--days=30 : Days after soft-deletion to permanently purge media}';
    protected $description = 'Clean orphaned and soft-deleted media assets from storage and database';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $orphaned = Media::onlyTrashed()
            ->where('deleted_at', '<', $cutoff)
            ->get();

        $count = 0;
        foreach ($orphaned as $media) {
            $media->forceDelete();
            $count++;
        }

        $this->info("Permanently purged {$count} soft-deleted media assets older than {$days} days.");
        return Command::SUCCESS;
    }
}
