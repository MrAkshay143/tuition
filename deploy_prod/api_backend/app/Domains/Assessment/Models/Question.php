<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'topic_id',
        'difficulty_id',
        'teacher_id',
        'content',
        'type',
        'options',
        'correct_answer',
        'solution_explanation',
        'default_marks',
        'default_time_seconds',
        'is_active'
    ];

    protected $casts = [
        'options' => 'array',
        'is_active' => 'boolean'
    ];

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    public function difficulty()
    {
        return $this->belongsTo(Difficulty::class);
    }

    public function tags()
    {
        return $this->belongsToMany(QuestionTag::class);
    }

    public function exams()
    {
        return $this->belongsToMany(Exam::class, 'exam_question_bank')
            ->withPivot('marks', 'sort_order');
    }
}
