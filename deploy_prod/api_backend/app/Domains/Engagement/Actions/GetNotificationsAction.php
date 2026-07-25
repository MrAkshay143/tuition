<?php

namespace App\Domains\Engagement\Actions;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\CursorPaginator;

class GetNotificationsAction
{
    public function execute(int $userId, ?string $type, int $perPage): CursorPaginator
    {
        return Notification::where("user_id", $userId)
            ->when($type, fn($q, $t) => $q->where("type", $t))
            ->latest()
            ->cursorPaginate($perPage);
    }
}
