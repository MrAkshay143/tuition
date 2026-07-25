<?php

namespace App\Domains\Core\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Enums\UserSessionStatus;

class PurgeRevokedSessionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Purge revoked or expired sessions older than 90 days
        UserSession::whereIn('status', [
            UserSessionStatus::REVOKED->value,
            UserSessionStatus::EXPIRED->value,
            UserSessionStatus::TERMINATED->value,
        ])
        ->where('updated_at', '<', now()->subDays(90))
        ->delete();
    }
}
