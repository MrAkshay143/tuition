<?php

namespace App\Domains\Engagement\Actions;

use App\Models\Notification;

class MarkAllNotificationsReadAction
{
    public function execute(int $userId): void
    {
        Notification::where("user_id", $userId)->whereNull("read_at")->update(["read_at" => now()]);
    }
}
