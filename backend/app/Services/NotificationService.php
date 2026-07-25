<?php

namespace App\Services;

use App\Domains\Core\Models\User;
use App\Notifications\GenericPushNotification;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /**
     * Send notification to recipients.
     */
    public function send($recipients, string $type, string $title, string $body, array $data = []): void
    {
        $users = collect(is_array($recipients) ? $recipients : [$recipients]);
        
        Notification::send($users, new GenericPushNotification($title, $body, $type, $data));
    }

    public function notifyBatch(int $batchId, string $type, string $title, string $body, array $data = []): void
    {
        $students = User::students()
            ->whereHas('batches', fn($q) => $q->where('batches.id', $batchId))
            ->get();
        $this->send($students, $type, $title, $body, $data);
    }

    public function notifyAll(string $type, string $title, string $body, array $data = []): void
    {
        $students = User::students()->active()->get();
        $this->send($students, $type, $title, $body, $data);
    }
}

