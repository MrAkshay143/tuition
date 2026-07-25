<?php

namespace App\Domains\Media\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use SoftDeletes;

    protected $fillable = ['uploaded_by', 'title', 'description', 'file_path', 'file_type', 'file_size_bytes', 'is_public'];
    protected $casts    = ['is_public' => 'boolean'];

    public function uploader()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'uploaded_by');
    }

    public function batches()
    {
        return $this->belongsToMany(\App\Domains\Core\Models\Batch::class, 'batch_note');
    }

    public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
}
