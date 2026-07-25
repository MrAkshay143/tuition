<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CourseChapter extends Model
{
    use HasFactory;
    protected $table = 'course_chapters';
    protected $fillable = ['module_id', 'title', 'sort_order'];

    public function module()
    {
        return $this->belongsTo(CourseModule::class, 'module_id');
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'chapter_id')->orderBy('sort_order');
    }
}
