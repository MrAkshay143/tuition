<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use Illuminate\Support\Facades\Schedule;
use App\Domains\Core\Jobs\CleanupExpiredSessionsJob;
use App\Domains\Core\Jobs\PurgeRevokedSessionsJob;
use App\Domains\Media\Jobs\CleanupMediaJob;
use App\Domains\Analytics\Jobs\GenerateAnalyticsJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new CleanupExpiredSessionsJob)->hourly();
Schedule::job(new PurgeRevokedSessionsJob)->dailyAt('02:00');
Schedule::job(new CleanupMediaJob)->dailyAt('03:00');
Schedule::job(new GenerateAnalyticsJob)->dailyAt('04:00');

// Hostinger Cron Queue Worker & Maintenance Tasks (Task 4.5 & Task 4.6)
Schedule::command('queue:work --stop-when-empty')->everyMinute()->withoutOverlapping();
Schedule::command('queue:prune-stale')->daily();
Schedule::command('media:clean-orphaned')->daily();
Schedule::command('log:prune-old')->weekly();
