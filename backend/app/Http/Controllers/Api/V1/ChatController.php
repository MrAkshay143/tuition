<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use Illuminate\Http\Request;
use App\Domains\Core\Models\User;
use App\Domains\Chat\Models\ChatMessage;

class ChatController extends ApiController
{
    public function conversations(
        \App\Domains\Engagement\Requests\GetChatConversationsRequest $request,
        \App\Domains\Engagement\Actions\GetChatConversationsAction $action
    ) {
        $conversations = $action->execute($request->user());
        return $this->success($conversations, 'Conversations retrieved successfully');
    }

    public function thread(
        \App\Domains\Engagement\Requests\GetChatThreadRequest $request,
        \App\Domains\Engagement\Actions\GetChatThreadAction $action,
        $partnerId
    ) {
        $messages = $action->execute($request->user()->id, $partnerId);
        return $this->paginated($messages, 'Chat thread retrieved successfully');
    }

    public function send(
        \App\Domains\Engagement\Requests\SendChatMessageRequest $request,
        \App\Domains\Chat\Actions\SendMessageAction $action,
        $partnerId
    ) {
        $validated = $request->validated();
        $message = $action->execute(
            $request->user()->id, 
            $partnerId, 
            $validated['message'], 
            'text', 
            $validated['media_id'] ?? null
        );
        return $this->success($message, 'Message sent', 201);
    }

    public function markRead(
        \App\Domains\Engagement\Requests\MarkChatReadRequest $request,
        \App\Domains\Engagement\Actions\MarkChatReadAction $action,
        $partnerId
    ) {
        $action->execute($request->user()->id, $partnerId);
        return $this->success(null, 'Messages marked as read');
    }

    public function unreadCount(Request $request) {
        $count = ChatMessage::where('receiver_id', $request->user()->id)
            ->where('read', false)
            ->count();
        return $this->success(['count' => $count], 'Unread chat messages count retrieved successfully');
    }
}
