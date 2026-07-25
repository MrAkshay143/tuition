<?php

namespace App\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Support\Str;

use App\Support\Traits\HasOwner;

class Media extends Model
{
    use SoftDeletes, HasOwner;

    protected $table = 'media';

    protected $fillable = [
        'uuid', 'name', 'original_name', 'provider', 'storage_driver',
        'mime', 'extension', 'size', 'duration', 'resolution', 'thumbnail',
        'checksum', 'processing_status', 'visibility', 'path', 'filename',
        'mime_type', 'size_bytes', 'uploaded_by',
        'description', 'type', 'category_id', 'publish_at'
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

    protected $appends = ['url', 'thumbnail_url'];

    public function getUrlAttribute(): string
    {
        if (in_array($this->provider, ['youtube', 'vimeo', 'external'])) {
            if ($this->provider === 'youtube') {
                return 'https://www.youtube.com/watch?v=' . $this->path;
            } elseif ($this->provider === 'vimeo') {
                return 'https://vimeo.com/' . $this->path;
            }
            return $this->path;
        }
        return asset('storage/' . $this->path);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->thumbnail) {
            return str_starts_with($this->thumbnail, 'http') ? $this->thumbnail : asset('storage/' . $this->thumbnail);
        }
        return null;
    }

    public function uploader()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'uploaded_by');
    }

    public function category()
    {
        return $this->belongsTo(ContentCategory::class, 'category_id');
    }

    public function tags()
    {
        return $this->belongsToMany(ContentTag::class, 'content_tag_pivot', 'media_id', 'tag_id');
    }

    public function links()
    {
        return $this->hasMany(MediaLink::class, 'media_id');
    }

    public function statistics()
    {
        return $this->hasOne(MediaStatistic::class, 'media_id');
    }

    public function primaryLessons()
    {
        return $this->morphedByMany(\App\Domains\Course\Models\Lesson::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'primary');
    }

    public function downloadLessons()
    {
        return $this->morphedByMany(\App\Domains\Course\Models\Lesson::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'download');
    }
}
