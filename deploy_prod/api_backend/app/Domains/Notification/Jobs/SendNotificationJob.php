<?php

namespace App\Domains\Notification\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Core\Models\User;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $title,
        public readonly string $body,
        public readonly array $data = []
    ) {}

    public function handle(): void
    {
        \App\Models\Notification::create([
            'user_id' => $this->user->id,
            'title'   => $this->title,
            'body'    => $this->body,
            'type'    => $this->data['type'] ?? 'system',
            'data'    => $this->data,
            'read_at' => null,
        ]);
    }
}
