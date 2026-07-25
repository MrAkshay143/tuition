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
        \Illuminate\Support\Facades\Gate::authorize('message', [\App\Domains\Chat\Models\ChatConversation::class, (int)$partnerId]);
        $messages = $action->execute($request->user()->id, $partnerId);
        return $this->paginated($messages, 'Chat thread retrieved successfully');
    }
    
    // Fallback sync for missed messages
    public function syncMessages(Request $request) {
        $after = $request->query('after_created_at');
        
        $messages = ChatMessage::where(function($q) use ($request) {
                $q->where('receiver_id', $request->user()->id)
                  ->orWhere('sender_id', $request->user()->id);
            })
            ->when($after, function($q) use ($after) {
                $q->where('created_at', '>', $after);
            })
            ->orderBy('created_at', 'asc')
            ->get();
            
        return $this->success($messages, 'Synced messages');
    }

    public function send(
        \App\Domains\Engagement\Requests\SendChatMessageRequest $request,
        \App\Domains\Chat\Actions\SendMessageAction $action,
        $partnerId
    ) {
        \Illuminate\Support\Facades\Gate::authorize('message', [\App\Domains\Chat\Models\ChatConversation::class, (int)$partnerId]);
        
        $validated = $request->validated();
        $message = $action->execute(
            $request->user()->id, 
            $partnerId, 
            $validated['message'], 
            'text', 
            $validated['media_id'] ?? null,
            $validated['uuid'] ?? null
        );
        return $this->success($message, 'Message sent', 201);
    }
    
    public function updateStatus(Request $request, $uuid) {
        $validated = $request->validate([
            'status' => 'required|in:delivered,read'
        ]);
        
        $message = ChatMessage::where('uuid', $uuid)->firstOrFail();
        
        // Ensure user is receiver
        if ($message->receiver_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }
        
        if ($validated['status'] === 'delivered') {
            $message->status = 'delivered';
            $message->delivered_at = now();
        } else if ($validated['status'] === 'read') {
            $message->status = 'read';
            $message->read_at = now();
            $message->read = true; // legacy support
        }
        
        $message->save();
        
        return $this->success($message, 'Message status updated');
    }
    
    public function messageAction(Request $request, $uuid) {
        $validated = $request->validate([
            'action' => 'required|in:edit,delete,react,pin',
            'payload' => 'nullable'
        ]);
        
        $message = ChatMessage::where('uuid', $uuid)->firstOrFail();
        $user = $request->user();
        
        // Ensure user is part of the conversation
        $conversation = \App\Domains\Chat\Models\ChatConversation::find($message->conversation_id);
        if ($conversation) {
            \Illuminate\Support\Facades\Gate::authorize('message', [\App\Domains\Chat\Models\ChatConversation::class, $message->receiver_id === $user->id ? $message->sender_id : $message->receiver_id]);
        }

        if ($validated['action'] === 'edit') {
            if ($message->sender_id !== $user->id) return $this->error('Unauthorized', 403);
            $message->text = $validated['payload'];
            $message->body = $validated['payload'];
            $message->edited_at = now();
        } else if ($validated['action'] === 'delete') {
            // payload could be 'me' or 'everyone'
            $deletedFor = $message->deleted_for ?? [];
            if ($validated['payload'] === 'everyone' && $message->sender_id === $user->id) {
                $message->deleted_at = now();
            } else {
                if (!in_array($user->id, $deletedFor)) {
                    $deletedFor[] = $user->id;
                    $message->deleted_for = $deletedFor;
                }
            }
        } else if ($validated['action'] === 'react') {
            $reactions = $message->reactions ?? [];
            $emoji = $validated['payload'];
            // simple toggle logic
            if (isset($reactions[$emoji]) && in_array($user->id, $reactions[$emoji])) {
                $reactions[$emoji] = array_diff($reactions[$emoji], [$user->id]);
                if (empty($reactions[$emoji])) unset($reactions[$emoji]);
            } else {
                $reactions[$emoji][] = $user->id;
            }
            $message->reactions = $reactions;
        } else if ($validated['action'] === 'pin') {
            $message->is_pinned = !$message->is_pinned;
        }
        
        $message->save();
        return $this->success($message, 'Message action applied');
    }

    // Legacy bulk read
    public function markRead(
        \App\Domains\Engagement\Requests\MarkChatReadRequest $request,
        \App\Domains\Engagement\Actions\MarkChatReadAction $action,
        $partnerId
    ) {
        \Illuminate\Support\Facades\Gate::authorize('message', [\App\Domains\Chat\Models\ChatConversation::class, (int)$partnerId]);
        
        $action->execute($request->user()->id, $partnerId);
        
        // Also update new fields
        ChatMessage::where('receiver_id', $request->user()->id)
            ->where('sender_id', $partnerId)
            ->where('status', '!=', 'read')
            ->update([
                'status' => 'read',
                'read_at' => now(),
                'read' => true
            ]);
            
        return $this->success(null, 'Messages marked as read');
    }

    public function unreadCount(Request $request) {
        $count = ChatMessage::where('receiver_id', $request->user()->id)
            ->where('read', false)
            ->count();
        return $this->success(['count' => $count], 'Unread chat messages count retrieved successfully');
    }
    
    public function presence(Request $request) {
        // Update user last seen
        $user = $request->user();
        \Illuminate\Support\Facades\Cache::put("user:{$user->id}:last_seen", now(), now()->addMinutes(5));
        return $this->success(null, 'Presence updated');
    }
}
