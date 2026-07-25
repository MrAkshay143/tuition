<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Support\Traits\HasOwner;
use App\Support\Traits\UsesActivityLog;

class Course extends Model
{
    use SoftDeletes, HasOwner, UsesActivityLog;

    protected $fillable = [
        'program_id', 'subject_id', 'title', 'description', 'thumbnail', 'teacher_id', 'status', 'sort_order',
        'publish_at', 'unpublish_at', 'timezone'
    ];

    protected static function boot()
    {
        parent::boot();

        static::updating(function ($course) {
            if ($course->isDirty('status')) {
                $oldStatus = \App\Domains\Course\Enums\CourseStatus::from($course->getOriginal('status'));
                $newStatus = \App\Domains\Course\Enums\CourseStatus::from($course->status);
                if (!$oldStatus->canTransitionTo($newStatus)) {
                    throw new \DomainException("Invalid status transition from {$oldStatus->value} to {$newStatus->value}.");
                }
            }
        });
    }

    protected $casts = [
        'publish_at'   => 'datetime',
        'unpublish_at' => 'datetime',
    ];

    public function program()
    {
        return $this->belongsTo(\App\Domains\Academic\Models\Program::class, 'program_id');
    }

    public function subject()
    {
        return $this->belongsTo(\App\Domains\Academic\Models\Subject::class, 'subject_id');
    }

    public function teacher()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'teacher_id');
    }

    public function batches()
    {
        return $this->belongsToMany(\App\Domains\Core\Models\Batch::class);
    }

    public function modules()
    {
        return $this->hasMany(CourseModule::class)->orderBy('sort_order');
    }

    public function enrollments()
    {
        return $this->hasMany(\App\Domains\Learning\Models\Enrollment::class);
    }

    public function versions()
    {
        return $this->hasMany(CourseVersion::class)->orderBy('version', 'desc');
    }

    public function editSessions()
    {
        return $this->hasMany(CourseEditSession::class);
    }

    public function activeEditSession()
    {
        return $this->hasOne(CourseEditSession::class)->where('expires_at', '>', now());
    }

    public function activityLogs()
    {
        return $this->hasMany(CourseActivityLog::class)->latest();
    }

    public function publishHistories()
    {
        return $this->hasMany(CoursePublishHistory::class)->latest();
    }

    public function scopeEducationTypeId($query, $educationTypeId)
    {
        return $query->whereHas('program', function ($q) use ($educationTypeId) {
            $q->where('education_type_id', $educationTypeId);
        });
    }

    public function scopeVisibleTo($query, $user = null)
    {
        if (!$user || $user->isAdmin()) {
            return $query;
        }
        if ($user->isTeacher()) {
            return $query->where('teacher_id', $user->id);
        }
        return $query->whereHas('batches.students', fn($q) => $q->where('users.id', $user->id));
    }
}
