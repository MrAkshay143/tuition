<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;

class ExamSecurityLog extends Model
{
    protected $fillable = [
        'exam_attempt_id', 'user_id', 'exam_id', 
        'event_type', 'severity', 'browser', 
        'device', 'ip', 'user_agent', 'details'
    ];

    protected $casts = [
        'details' => 'array'
    ];

    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }
}
