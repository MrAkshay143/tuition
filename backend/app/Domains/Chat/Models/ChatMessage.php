<?php

namespace App\Domains\Chat\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $table = 'chat_messages';

    protected $fillable = ['sender_id', 'receiver_id', 'type', 'body', 'read', 'read_at'];
    protected $casts    = ['read' => 'boolean', 'read_at' => 'datetime'];

    public function sender()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'receiver_id');
    }

    public function attachedMedia()
    {
        return $this->morphToMany(\App\Domains\Media\Models\Media::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'attachment');
    }
}
