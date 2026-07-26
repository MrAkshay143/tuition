<?php

namespace App\Domains\Engagement\Actions;

use App\Domains\Chat\Models\ChatMessage;
use Illuminate\Support\Collection;

class GetChatThreadAction
{
    public function execute(int $userId, int $partnerId): Collection
    {
        return ChatMessage::with(['media', 'replyTo'])
            ->where(function($q) use ($userId, $partnerId) {
                $q->where('sender_id', $userId)->where('receiver_id', $partnerId);
            })
            ->orWhere(function($q) use ($userId, $partnerId) {
                $q->where('sender_id', $partnerId)->where('receiver_id', $userId);
            })
            ->orderBy('created_at', 'asc')
            ->limit(100)
            ->get()
            ->map(function($msg) {
                return [
                    'uuid'                  => $msg->uuid,
                    'id'                    => $msg->id,
                    'sender_id'             => $msg->sender_id,
                    'receiver_id'           => $msg->receiver_id,
                    'body'                  => $msg->body ?? $msg->text,
                    'message'               => $msg->body ?? $msg->text,
                    'message_type'          => $msg->message_type ?? $msg->type ?? 'text',
                    'type'                  => $msg->message_type ?? $msg->type ?? 'text',
                    'status'                => $msg->status,
                    'is_pinned'             => $msg->is_pinned,
                    'reactions'             => $msg->reactions ?? [],
                    'deleted_for'           => $msg->deleted_for ?? [],
                    'deleted_at'            => $msg->deleted_at,
                    'edited_at'             => $msg->edited_at,
                    'created_at'            => $msg->created_at,
                    'reply_to_message_uuid' => $msg->reply_to_message_uuid,
                    'call_duration'         => null,
                    'media'                 => $msg->media ? [
                        'id'        => $msg->media->id,
                        'url'       => $msg->media->url ?? $msg->media->path,
                        'mime_type' => $msg->media->mime_type ?? $msg->media->type,
                        'title'     => $msg->media->title ?? $msg->media->name,
                        'size'      => $msg->media->size ?? null,
                    ] : null,
                ];
            });
    }
}

