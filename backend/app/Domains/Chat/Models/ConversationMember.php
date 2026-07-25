<?php

namespace App\Domains\Chat\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationMember extends Model
{
    protected $table = 'conversation_members';

    protected $fillable = [
        'conversation_id', 'user_id', 'last_read_message_uuid', 'joined_at'
    ];

    protected $casts = [
        'joined_at' => 'datetime'
    ];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'user_id');
    }
}
