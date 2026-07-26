<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;

class ExamAttempt extends Model
{
    protected $table = 'exam_attempts';

    protected $fillable = [
        'exam_id', 'student_id', 'score', 'percentage', 'passed',
        'answers', 'started_at', 'submitted_at',
    ];
    protected $casts = [
        'passed'       => 'boolean',
        'answers'      => 'array',
        'started_at'   => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'student_id');
    }

    public function securityLogs()
    {
        return $this->hasMany(\App\Domains\Assessment\Models\ExamSecurityLog::class, 'exam_attempt_id');
    }
}
