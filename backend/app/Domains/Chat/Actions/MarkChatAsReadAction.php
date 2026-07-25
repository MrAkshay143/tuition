<?php

namespace App\Domains\Chat\Actions;

use App\Domains\Chat\Models\ChatMessage;
use Illuminate\Support\Carbon;

class MarkChatAsReadAction
{
    /**
     * Mark all unread messages from a specific sender as read.
     */
    public function execute(int $senderId, int $receiverId): int
    {
        return ChatMessage::where('sender_id', $senderId)
            ->where('receiver_id', $receiverId)
            ->where('read', false)
            ->update([
                'read'    => true,
                'read_at' => Carbon::now(),
            ]);
    }
}
