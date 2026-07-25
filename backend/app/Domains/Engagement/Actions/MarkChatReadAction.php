<?php

namespace App\Domains\Engagement\Actions;

use App\Domains\Chat\Models\ChatMessage;

class MarkChatReadAction
{
    public function execute(int $userId, int $partnerId): void
    {
        ChatMessage::where("sender_id", $partnerId)
            ->where("receiver_id", $userId)
            ->where("read", false)
            ->update(["read" => true]);
    }
}
