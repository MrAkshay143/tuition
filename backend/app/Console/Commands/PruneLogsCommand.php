<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class PruneLogsCommand extends Command
{
    protected $signature = 'log:prune-old {--days=14 : Number of days to retain log files}';
    protected $description = 'Prune log files older than specified days';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $logPath = storage_path('logs');

        if (!File::exists($logPath)) {
            $this->info('Log path does not exist.');
            return Command::SUCCESS;
        }

        $files = File::files($logPath);
        $count = 0;
        $cutoff = now()->subDays($days)->getTimestamp();

        foreach ($files as $file) {
            if ($file->getMTime() < $cutoff && $file->getExtension() === 'log') {
                File::delete($file->getPathname());
                $count++;
            }
        }

        $this->info("Pruned {$count} log files older than {$days} days.");
        return Command::SUCCESS;
    }
}
