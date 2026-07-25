<?php

namespace App\Domains\Engagement\Actions;

use App\Domains\Chat\Models\ChatMessage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetChatThreadAction
{
    public function execute(int $userId, int $partnerId): LengthAwarePaginator
    {
        return ChatMessage::where(function($q) use ($userId, $partnerId) {
                $q->where("sender_id", $userId)->where("receiver_id", $partnerId);
            })
            ->orWhere(function($q) use ($userId, $partnerId) {
                $q->where("sender_id", $partnerId)->where("receiver_id", $userId);
            })
            ->orderBy("created_at", "desc")
            ->paginate(50);
    }
}
