<?php

namespace App\Domains\Engagement\Actions;

use App\Models\NotificationPreference;

class GetNotificationPreferencesAction
{
    public function execute(int $userId): NotificationPreference
    {
        return NotificationPreference::firstOrCreate(
            ["user_id" => $userId],
            ["in_app" => true, "email" => true, "push" => true]
        );
    }
}
