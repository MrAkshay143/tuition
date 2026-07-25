<?php

namespace App\Domains\Chat\Models;

use Illuminate\Database\Eloquent\Model;

class ChatConversation extends Model
{
    protected $table = 'chat_conversations';

    protected $fillable = [
        'type', 'created_by', 'last_message_uuid', 'last_message_at', 'is_archived'
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'is_archived' => 'boolean'
    ];

    public function creator()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'created_by');
    }

    public function lastMessage()
    {
        return $this->belongsTo(ChatMessage::class, 'last_message_uuid', 'uuid');
    }

    public function members()
    {
        return $this->hasMany(ConversationMember::class, 'conversation_id');
    }

    public function users()
    {
        return $this->belongsToMany(\App\Domains\Core\Models\User::class, 'conversation_members', 'conversation_id', 'user_id')
                    ->withPivot('last_read_message_uuid', 'joined_at');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }
}
