<?php

namespace App\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;

class MediaLink extends Model
{
    protected $table = 'media_links';

    protected $fillable = [
        'media_id', 'entity_type', 'entity_id', 'link_type', 'display_order', 'is_required', 'created_by'
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function media()
    {
        return $this->belongsTo(Media::class, 'media_id');
    }

    public function entity()
    {
        return $this->morphTo();
    }

    public function creator()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'created_by');
    }
}
