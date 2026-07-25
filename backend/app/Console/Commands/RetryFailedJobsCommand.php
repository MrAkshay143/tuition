<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class RetryFailedJobsCommand extends Command
{
    protected $signature = 'queue:retry-all';
    protected $description = 'Retry all failed queue jobs in the database queue';

    public function handle(): int
    {
        $this->info('Retrying all failed database queue jobs...');
        Artisan::call('queue:retry', ['id' => ['all']]);
        $this->info(Artisan::output());
        return Command::SUCCESS;
    }
}
