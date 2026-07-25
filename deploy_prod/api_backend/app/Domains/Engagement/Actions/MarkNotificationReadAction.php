<?php

namespace App\Domains\Engagement\Actions;

use App\Models\Notification;

class MarkNotificationReadAction
{
    public function execute(int $userId, string $id): void
    {
        Notification::where("user_id", $userId)
            ->where("id", $id)
            ->whereNull("read_at")
            ->update(["read_at" => now()]);
    }
}
