<?php

namespace App\Domains\Engagement\Actions;

use App\Models\Notification;

class GetUnreadNotificationsCountAction
{
    public function execute(int $userId): int
    {
        return Notification::where("user_id", $userId)->whereNull("read_at")->count();
    }
}
