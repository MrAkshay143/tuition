<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Support\Traits\HasOwner;

class Exam extends Model
{
    use SoftDeletes, HasOwner;

    protected $fillable = [
        'title', 'description', 'type', 'duration_minutes', 'total_marks', 'pass_marks',
        'starts_at', 'ends_at', 'show_result_immediately', 'shuffle_questions', 'teacher_id',
    ];
    protected $casts = [
        'starts_at'               => 'datetime',
        'ends_at'                 => 'datetime',
        'show_result_immediately' => 'boolean',
        'shuffle_questions'       => 'boolean',
    ];

    public function batches()
    {
        return $this->belongsToMany(\App\Domains\Core\Models\Batch::class, 'exam_batch');
    }

    public function teacher()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'teacher_id');
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'exam_question_bank')
            ->withPivot('marks', 'sort_order')
            ->orderByPivot('sort_order');
    }

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }
}

