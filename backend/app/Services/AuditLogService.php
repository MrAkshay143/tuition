<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditLogService
{
    /**
     * Record an administrative audit log entry.
     */
    public function log(int $userId, string $action, string $targetType, int $targetId, array $details = []): void
    {
        DB::table('activity_logs')->insert([
            'user_id'     => $userId,
            'action'      => $action,
            'entity_type' => $targetType,
            'entity_id'   => $targetId,
            'details'     => json_encode($details),
            'ip_address'  => request()->ip(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }
}
