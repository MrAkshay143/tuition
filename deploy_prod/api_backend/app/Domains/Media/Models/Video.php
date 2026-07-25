<?php

namespace App\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Video extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uploaded_by', 'title', 'description', 'url', 'thumbnail',
        'provider', 'duration_seconds', 'file_size_bytes', 'status', 'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function uploader()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'uploaded_by');
    }
}
