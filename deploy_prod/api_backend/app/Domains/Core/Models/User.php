<?php

namespace App\Domains\Core\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'avatar', 'theme', 'phone',
        'active', 'google_id', 'fcm_token', 'two_factor_enabled', 'last_login_at',
        'session_version', 'password_changed_at', 'security_updated_at', 'force_logout_at',
        'max_sessions', 'enforcement_policy', 'inherit_global_policy',
    ];

    protected $hidden = ['password', 'remember_token', 'fcm_token', 'google_id'];

    protected $casts = [
        'email_verified_at'   => 'datetime',
        'last_login_at'       => 'datetime',
        'password_changed_at' => 'datetime',
        'security_updated_at' => 'datetime',
        'force_logout_at'     => 'datetime',
        'password'            => 'hashed',
        'active'              => 'boolean',
        'two_factor_enabled'  => 'boolean',
        'inherit_global_policy' => 'boolean',
        'session_version'     => 'integer',
        'max_sessions'        => 'integer',
    ];

    public function userSessions()
    {
        return $this->hasMany(UserSession::class);
    }

    // ── Scopes ──────────────────────────────────────────────────────
    public function scopeActive($query) { return $query->where('active', true); }
    public function scopeStudents($query) { return $query->where('role', 'student'); }
    public function scopeTeachers($query) { return $query->where('role', 'teacher'); }

    // ── Relationships ───────────────────────────────────────────────
    public function batches()
    {
        return $this->belongsToMany(Batch::class, 'batch_student', 'student_id', 'batch_id')
            ->withPivot('enrolled_at');
    }

    public function notifications()
    {
        return $this->hasMany(\App\Domains\Notification\Models\Notification::class)->latest();
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function deviceSessions()
    {
        return $this->hasMany(DeviceSession::class);
    }

    public function notificationPreferences()
    {
        return $this->hasOne(\App\Domains\Notification\Models\NotificationPreference::class);
    }

    public function lessonProgress()
    {
        return $this->hasMany(\App\Domains\Learning\Models\LessonProgress::class);
    }

    public function enrollments()
    {
        return $this->hasMany(\App\Domains\Learning\Models\Enrollment::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(\App\Domains\Learning\Models\StudentBookmark::class);
    }

    public function learningHistory()
    {
        return $this->hasMany(\App\Domains\Learning\Models\LearningHistory::class);
    }

    public function learningSessions()
    {
        return $this->hasMany(\App\Domains\Learning\Models\LearningSession::class);
    }

    public function completions()
    {
        return $this->hasMany(\App\Domains\Learning\Models\CourseCompletion::class);
    }

    public function streak()
    {
        return $this->hasOne(\App\Domains\Learning\Models\LearningStreak::class);
    }

    public function assignmentSubmissions()
    {
        return $this->hasMany(\App\Domains\Assessment\Models\AssignmentSubmission::class, 'student_id');
    }

    public function examAttempts()
    {
        return $this->hasMany(\App\Domains\Assessment\Models\ExamAttempt::class, 'student_id');
    }

    public function certificates()
    {
        return $this->hasMany(\App\Domains\Certificate\Models\Certificate::class);
    }

    public function courses()
    {
        return $this->belongsToMany(\App\Domains\Course\Models\Course::class, 'enrollments', 'user_id', 'course_id')
            ->withPivot(['batch_id', 'status', 'enrolled_at', 'expires_at']);
    }


    public function sentMessages()
    {
        return $this->hasMany(\App\Domains\Chat\Models\ChatMessage::class, 'sender_id');
    }

    // ── Helpers ─────────────────────────────────────────────────────
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isTeacher(): bool  { return $this->role === 'teacher'; }
    public function isStudent(): bool  { return $this->role === 'student'; }

    public function hasRole(string|array $roles): bool
    {
        if (is_array($roles)) {
            return in_array($this->role, $roles);
        }
        return $this->role === $roles;
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $rolePermissions = [
            'teacher' => [
                'course.view', 'course.create', 'course.update', 'course.publish', 'course.archive',
                'batch.manage',
                'media.upload', 'media.delete',
                'live_class.manage', 'assignment.manage', 'exam.manage',
                'student.view', 'student.manage',
                'certificate.generate', 'dashboard.view'
            ],
            'student' => [
                'course.view', 'dashboard.view'
            ]
        ];

        return in_array($permission, $rolePermissions[$this->role] ?? []);
    }

    public function getAvatarAttribute($value): ?string
    {
        if (!$value) return null;
        return str_starts_with($value, 'http') ? $value : asset('storage/' . $value);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar;
    }

    public function incrementSessionVersion(): void
    {
        $this->increment('session_version');
        $this->update([
            'security_updated_at' => now(),
            'force_logout_at'     => now(),
        ]);

        $this->userSessions()
            ->where('status', \App\Domains\Core\Enums\UserSessionStatus::ACTIVE->value)
            ->update([
                'status'     => \App\Domains\Core\Enums\UserSessionStatus::REVOKED->value,
                'revoked_at' => now(),
            ]);
    }

    /**
     * Send queued password reset notification with SPA reset URL.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordQueuedNotification($token));
    }
}
