<?php

namespace App\Domains\Core\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Enums\UserSessionStatus;

class CleanupExpiredSessionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        UserSession::where('status', UserSessionStatus::ACTIVE->value)
            ->where(function ($q) {
                $q->where('expires_at', '<=', now())
                  ->orWhere('absolute_expires_at', '<=', now());
            })
            ->update([
                'status' => UserSessionStatus::EXPIRED->value,
            ]);
    }
}
