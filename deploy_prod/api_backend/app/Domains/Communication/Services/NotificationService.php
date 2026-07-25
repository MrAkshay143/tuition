<?php

namespace App\Domains\Communication\Services;

use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /**
     * Dispatch an in-app and email notification to a user or group of users.
     * @param \Illuminate\Support\Collection|User|array $notifiables
     * @param \Illuminate\Notifications\Notification $notification
     */
    public function send($notifiables, \Illuminate\Notifications\Notification $notification)
    {
        Notification::send($notifiables, $notification);
    }
}
