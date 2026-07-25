<?php

namespace App\Domains\Chat\Actions;

use App\Domains\Chat\Models\ChatMessage;
use App\Domains\Media\Services\UploadService;
use App\Domains\Core\Models\ActivityLog;
use Illuminate\Http\UploadedFile;

class SendMessageAction
{
    protected UploadService $uploader;

    public function __construct(UploadService $uploader)
    {
        $this->uploader = $uploader;
    }

    /**
     * Send a direct chat message, supporting optional attachments.
     */
    public function execute(int $senderId, int $receiverId, string $body, string $type = 'text', ?int $mediaId = null): ChatMessage
    {
        if ($mediaId) {
            $type = 'file';
        }

        $message = ChatMessage::create([
            'sender_id'   => $senderId,
            'receiver_id' => $receiverId,
            'type'        => $type,
            'body'        => $body,
            'read'        => false,
        ]);

        if ($mediaId) {
            app(\App\Domains\Media\Services\MediaLinkService::class)->link(
                $mediaId,
                ChatMessage::class,
                $message->id,
                'attachment',
                1,
                false,
                $senderId
            );
        }

        return $message;
    }
}
