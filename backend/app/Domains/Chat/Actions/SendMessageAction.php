<?php

namespace App\Domains\Chat\Actions;

use App\Domains\Chat\Models\ChatMessage;
use App\Domains\Chat\Models\ChatConversation;
use App\Domains\Chat\Models\ConversationMember;

class SendMessageAction
{
    /**
     * Send a direct chat message, supporting optional attachments.
     */
    public function execute(int $senderId, int $receiverId, string $body, string $type = 'text', ?int $mediaId = null, ?string $uuid = null): ChatMessage
    {
        if ($mediaId) {
            $type = 'media';
        }

        // 1. Check for Duplicate UUID
        if ($uuid && ChatMessage::where('uuid', $uuid)->exists()) {
            return ChatMessage::where('uuid', $uuid)->first();
        }

        // 2. Find or create the conversation
        // For private chats, it's simpler to check if there's an existing private conversation with exactly these two members.
        // A robust way is to query conversations of type 'private' where both users are members.
        $conversation = ChatConversation::where('type', 'private')
            ->whereHas('members', function($q) use ($senderId) {
                $q->where('user_id', $senderId);
            })
            ->whereHas('members', function($q) use ($receiverId) {
                $q->where('user_id', $receiverId);
            })
            ->first();

        if (!$conversation) {
            $conversation = ChatConversation::create([
                'type' => 'private',
                'created_by' => $senderId
            ]);
            
            ConversationMember::create(['conversation_id' => $conversation->id, 'user_id' => $senderId]);
            ConversationMember::create(['conversation_id' => $conversation->id, 'user_id' => $receiverId]);
        }

        // 2. Create the message
        $message = ChatMessage::create([
            'uuid'            => $uuid ?? \Illuminate\Support\Str::uuid(),
            'conversation_id' => $conversation->id,
            'sender_id'       => $senderId,
            'receiver_id'     => $receiverId,
            'message_type'    => $type,
            'type'            => $type, // legacy support
            'body'            => $body, // legacy support
            'text'            => $body,
            'media_id'        => $mediaId,
            'status'          => 'sent',
            'sent_at'         => now(),
            'read'            => false, // legacy support
        ]);

        // 3. Update Conversation
        $conversation->update([
            'last_message_uuid' => $message->uuid,
            'last_message_at'   => $message->sent_at,
        ]);

        // 4. Link Media if needed (legacy fallback or just relying on media_id column)
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
