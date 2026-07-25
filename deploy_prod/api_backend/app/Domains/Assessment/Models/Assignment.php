<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Support\Traits\HasOwner;

class Assignment extends Model
{
    use SoftDeletes, HasOwner;

    protected $fillable = ['title', 'description', 'attachment', 'due_at', 'max_marks', 'teacher_id'];
    protected $casts    = ['due_at' => 'datetime'];

    public function batches()
    {
        return $this->belongsToMany(\App\Domains\Core\Models\Batch::class, 'assignment_batch', 'assignment_id', 'batch_id');
    }

    public function teacher()
    {
        return $this->belongsTo(\App\Models\User::class, 'teacher_id');
    }

    public function batch()
    {
        return $this->belongsTo(\App\Domains\Core\Models\Batch::class);
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function attachedMedia()
    {
        return $this->morphToMany(\App\Domains\Media\Models\Media::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'attachment')
            ->withPivot(['display_order', 'is_required']);
    }
}
