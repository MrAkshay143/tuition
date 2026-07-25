<?php

namespace App\Services;

use App\Models\User;
use App\Models\Notification;
use App\Models\NotificationPreference;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a notification to one or many users.
     *
     * @param User|User[]|\Illuminate\Support\Collection $recipients
     * @param string  $type    — Type key (e.g. 'assignment_due', 'live_reminder')
     * @param string  $title
     * @param string  $body
     * @param array   $data    — Optional extra payload
     * @param array   $channels — ['in_app', 'push']  (default: both)
     */
    public function send($recipients, string $type, string $title, string $body, array $data = [], array $channels = ['in_app', 'push']): void
    {
        $users = collect(is_array($recipients) ? $recipients : [$recipients]);

        foreach ($users as $user) {
            $prefs = $this->getPrefs($user->id);

            // ── In-app notification ───────────────────────────────────────
            if (in_array('in_app', $channels) && ($prefs->in_app ?? true)) {
                $this->createInApp($user, $type, $title, $body, $data);
            }

            // ── FCM push notification ─────────────────────────────────────
            if (in_array('push', $channels) && ($prefs->push ?? true) && $user->fcm_token) {
                $this->sendFcm($user->fcm_token, $title, $body, $data);
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function createInApp(User $user, string $type, string $title, string $body, array $data): void
    {
        Notification::create([
            'id'      => (string) Str::uuid(),
            'user_id' => $user->id,
            'type'    => $type,
            'icon'    => $this->getIcon($type),
            'title'   => $title,
            'body'    => $body,
            'data'    => $data ?: null,
        ]);
    }

    private function sendFcm(string $fcmToken, string $title, string $body, array $data = []): void
    {
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
                'data'         => array_merge($data, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK']),
                'priority'     => 'high',
            ]);

            if (!$response->successful()) {
                Log::warning('FCM push failed', ['status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error('FCM exception: ' . $e->getMessage());
        }
    }

    private function getPrefs(int $userId): ?NotificationPreference
    {
        return NotificationPreference::firstOrCreate(
            ['user_id' => $userId],
            ['in_app' => true, 'email' => true, 'push' => true]
        );
    }

    private function getIcon(string $type): string
    {
        return match($type) {
            'assignment_due'   => 'homework',
            'exam_reminder'    => 'exam',
            'live_reminder'    => 'live_class',
            'new_content'      => 'course',
            'new_notes'        => 'notes',
            'new_video'        => 'video',
            'holiday'          => 'holiday',
            'grade_posted'     => 'grade',
            'certificate'      => 'certificate',
            'chat'             => 'chat',
            default            => 'announcement',
        };
    }

    // ── Convenience methods ───────────────────────────────────────────────

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
