<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;
use App\Models\Notification as CustomNotification;
use App\Domains\Notification\Models\Notification as DomainNotification;

class CustomDatabaseChannel
{
    public function send($notifiable, Notification $notification)
    {
        $data = $notification->toDatabase($notifiable);

        $model = class_exists(DomainNotification::class) 
            ? DomainNotification::class 
            : CustomNotification::class;

        return $model::create([
            'id'      => Str::uuid()->toString(),
            'user_id' => $notifiable->id,
            'title'   => $data['title'] ?? '',
            'body'    => $data['body'] ?? '',
            'type'    => $data['type'] ?? 'general',
            'data'    => $data['data'] ?? [],
            'icon'    => $data['icon'] ?? 'announcement',
            'read_at' => null,
        ]);
    }
}
