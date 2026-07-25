<?php

namespace App\Domains\Core\Models;

use Illuminate\Database\Eloquent\Model;

class BatchAttendance extends Model
{
    protected $fillable = [
        'batch_id', 
        'student_id', 
        'lesson_id', 
        'attendance_date', 
        'status', 
        'remarks'
    ];

    protected $casts = [
        'attendance_date' => 'date',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function student()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'student_id');
    }

    public function lesson()
    {
        return $this->belongsTo(\App\Domains\Course\Models\Lesson::class);
    }
}

