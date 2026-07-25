<?php

namespace App\Domains\Core\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = ['created_by', 'title', 'body', 'type', 'is_all', 'channels', 'sent_at'];
    protected $casts    = [
        'is_all'    => 'boolean',
        'channels'  => 'array',
        'sent_at'   => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function batches()
    {
        return $this->belongsToMany(Batch::class);
    }
}
