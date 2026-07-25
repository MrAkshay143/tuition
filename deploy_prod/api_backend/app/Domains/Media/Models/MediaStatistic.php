<?php

namespace App\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;

class MediaStatistic extends Model
{
    protected $table = 'media_statistics';

    protected $fillable = [
        'media_id', 'views', 'downloads', 'last_viewed_at', 'last_downloaded_at'
    ];

    protected $casts = [
        'last_viewed_at' => 'datetime',
        'last_downloaded_at' => 'datetime',
    ];

    public function media()
    {
        return $this->belongsTo(Media::class, 'media_id');
    }
}
