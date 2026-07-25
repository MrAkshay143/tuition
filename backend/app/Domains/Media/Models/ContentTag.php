<?php

namespace App\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;

class ContentTag extends Model
{
    protected $table = 'content_tags';

    protected $fillable = ['name'];

    public function media()
    {
        return $this->belongsToMany(Media::class, 'content_tag_pivot', 'tag_id', 'media_id');
    }
}
