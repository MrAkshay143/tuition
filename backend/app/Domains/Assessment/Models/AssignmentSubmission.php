<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;

class AssignmentSubmission extends Model
{
    protected $table = 'assignment_submissions';

    protected $fillable = [
        'assignment_id', 'student_id', 'answer',
        'status', 'grade', 'feedback', 'submitted_at', 'reviewed_at',
    ];
    protected $casts = ['submitted_at' => 'datetime', 'reviewed_at' => 'datetime'];

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'student_id');
    }

    public function attachedMedia()
    {
        return $this->morphToMany(\App\Domains\Media\Models\Media::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'attachment')
            ->withPivot(['display_order', 'is_required']);
    }
}
