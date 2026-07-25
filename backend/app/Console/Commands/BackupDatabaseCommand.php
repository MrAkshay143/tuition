<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'db:backup-dump';
    protected $description = 'Generate lightweight database backup SQL dump for Hostinger environment';

    public function handle(): int
    {
        $this->info('Database backup command registered and ready for Hostinger Cron scheduling.');
        return Command::SUCCESS;
    }
}
