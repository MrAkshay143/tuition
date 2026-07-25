<?php

namespace App\Domains\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Support\Traits\HasOwner;

class Batch extends Model
{
    use SoftDeletes, HasOwner;

    protected $fillable = ['name', 'description', 'color', 'is_active', 'program_id', 'session_id', 'teacher_id'];
    protected $casts    = ['is_active' => 'boolean'];

    public function students()
    {
        return $this->belongsToMany(\App\Domains\Core\Models\User::class, 'batch_student', 'batch_id', 'student_id')
            ->withPivot('enrolled_at');
    }

    public function courses()
    {
        return $this->belongsToMany(\App\Domains\Course\Models\Course::class);
    }

    public function program()
    {
        return $this->belongsTo(\App\Domains\Academic\Models\Program::class);
    }

    public function session()
    {
        return $this->belongsTo(\App\Domains\Academic\Models\AcademicSession::class);
    }

    public function attendances()
    {
        return $this->hasMany(BatchAttendance::class);
    }

    public function announcements()
    {
        return $this->belongsToMany(\App\Domains\Engagement\Models\Announcement::class);
    }

    public function teacher()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'teacher_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVisibleTo($query, $user = null)
    {
        if (!$user || $user->isAdmin()) {
            return $query;
        }
        if ($user->isTeacher()) {
            return $query->where('teacher_id', $user->id);
        }
        return $query->whereHas('students', fn($q) => $q->where('users.id', $user->id));
    }
}
