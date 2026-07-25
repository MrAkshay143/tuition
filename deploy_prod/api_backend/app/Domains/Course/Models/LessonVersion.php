<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;

class LessonVersion extends Model
{
    protected $table = 'lesson_versions';

    protected $fillable = ['lesson_id', 'updated_by', 'title', 'content', 'version'];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function editor()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'updated_by');
    }
}
