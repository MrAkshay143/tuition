<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;

class LessonDependency extends Model
{
    protected $table = 'lesson_dependencies';
    protected $fillable = ['lesson_id', 'prerequisite_lesson_id'];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function prerequisiteLesson()
    {
        return $this->belongsTo(Lesson::class, 'prerequisite_lesson_id');
    }
}
