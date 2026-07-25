<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmChannel
{
    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toDatabase')) {
            return;
        }

        $data = $notification->toDatabase($notifiable);
        $title = $data['title'] ?? 'Notification';
        $body = $data['body'] ?? '';
        $extraData = $data['data'] ?? [];

        $fcmToken = $notifiable->fcm_token;

        if (!$fcmToken) {
            return;
        }

        $serverKey = config('services.fcm.server_key');
        if (!$serverKey) {
            Log::warning('FCM server key not configured. Skipping push notification.');
            return;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "key={$serverKey}",
                'Content-Type'  => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'to'           => $fcmToken,
                'notification' => [
                    'title' => $title,
                    'body'  => $body,
                    'sound' => 'default',
                    'badge' => 1,
                ],
                'data'         => array_merge($extraData, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK']),
                'priority'     => 'high',
            ]);

            if (!$response->successful()) {
                Log::warning('FCM push failed', ['status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error('FCM exception: ' . $e->getMessage());
        }
    }
}
