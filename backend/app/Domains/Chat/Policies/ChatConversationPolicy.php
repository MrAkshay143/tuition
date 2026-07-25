<?php

namespace App\Domains\Chat\Policies;

use App\Domains\Core\Models\User;
use App\Domains\Chat\Models\ChatConversation;
use Illuminate\Auth\Access\HandlesAuthorization;

class ChatConversationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can interact with the given conversation.
     */
    public function interact(User $user, ChatConversation $conversation): bool
    {
        return $conversation->members()->where('user_id', $user->id)->exists();
    }
    
    /**
     * Determine whether the user can message a partner.
     * In private chats, users can message anyone except themselves.
     */
    public function message(User $user, int $partnerId): bool
    {
        return $user->id !== $partnerId;
    }
}
