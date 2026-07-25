<?php

namespace App\Domains\Chat\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ChatMessage extends Model
{
    protected $table = 'chat_messages';
    protected $primaryKey = 'uuid';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'uuid', 'conversation_id', 'sender_id', 'receiver_id', 'reply_to_message_uuid', 
        'forwarded_from', 'message_type', 'type', 'body', 'text', 'media_id', 
        'read', 'read_at', 'status', 'sent_at', 'delivered_at', 'edited_at', 'deleted_at',
        'reactions', 'deleted_for', 'is_pinned'
    ];
    
    protected $casts = [
        'read' => 'boolean', 
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
        'reactions' => 'array',
        'deleted_for' => 'array',
        'is_pinned' => 'boolean'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function sender()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'receiver_id');
    }

    public function replyTo()
    {
        return $this->belongsTo(ChatMessage::class, 'reply_to_message_uuid', 'uuid');
    }

    public function media()
    {
        return $this->belongsTo(\App\Domains\Media\Models\Media::class, 'media_id');
    }

    public function attachedMedia()
    {
        // Fallback for legacy attachments
        return $this->morphToMany(\App\Domains\Media\Models\Media::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'attachment');
    }
}
