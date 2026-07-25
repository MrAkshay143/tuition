<?php

namespace App\Domains\Engagement\Actions;

use App\Models\NotificationPreference;

class UpdateNotificationPreferencesAction
{
    public function execute(int $userId, array $data): NotificationPreference
    {
        return NotificationPreference::updateOrCreate(["user_id" => $userId], $data);
    }
}
