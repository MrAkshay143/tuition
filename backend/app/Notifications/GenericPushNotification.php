<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\NotificationPreference;

class GenericPushNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $title;
    public $body;
    public $type;
    public $data;

    public int $tries = 3;
    public array $backoff = [15, 60, 300];

    public function __construct(string $title, string $body, string $type = 'system', array $data = [])
    {
        $this->title = $title;
        $this->body = $body;
        $this->type = $type;
        $this->data = $data;
        
        $this->onQueue('notifications');
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $prefs = NotificationPreference::firstOrCreate(
            ['user_id' => $notifiable->id],
            ['in_app' => true, 'email' => true, 'push' => true]
        );

        $channels = [];

        if ($prefs->in_app) {
            $channels[] = \App\Channels\CustomDatabaseChannel::class;
        }

        // Add custom FCM channel here
        if ($prefs->push && $notifiable->fcm_token) {
            $channels[] = \App\Channels\FcmChannel::class;
        }

        return $channels;
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'type' => $this->type,
            'data' => $this->data,
            'icon' => $this->getIcon($this->type),
        ];
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
}
