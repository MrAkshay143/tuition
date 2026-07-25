<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneStaleJobsCommand extends Command
{
    protected $signature = 'queue:prune-stale {--hours=48 : Hours after which completed/failed jobs are pruned}';
    protected $description = 'Prune completed and failed queue jobs older than specified hours';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $cutoff = now()->subHours($hours);

        $prunedFailed = DB::table('failed_jobs')->where('failed_at', '<', $cutoff)->delete();

        $this->info("Pruned {$prunedFailed} failed jobs older than {$hours} hours.");
        return Command::SUCCESS;
    }
}
