<?php

namespace App\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;

class ContentCategory extends Model
{
    protected $table = 'content_categories';

    protected $fillable = ['name', 'slug'];

    public function media()
    {
        return $this->hasMany(Media::class, 'category_id');
    }
}
