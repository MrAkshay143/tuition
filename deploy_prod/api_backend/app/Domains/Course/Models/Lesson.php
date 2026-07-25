<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Lesson extends Model
{
    use HasFactory;
    protected $fillable = [
        'chapter_id', 'title', 'type', 'content',
        'duration_seconds', 'is_free_preview', 'sort_order'
    ];

    protected $casts = [
        'is_free_preview' => 'boolean',
    ];

    public function chapter()
    {
        return $this->belongsTo(CourseChapter::class, 'chapter_id');
    }

    public function module()
    {
        return $this->hasOneThrough(
            CourseModule::class,
            CourseChapter::class,
            'id',
            'id',
            'chapter_id',
            'module_id'
        );
    }

    public function primaryMedia()
    {
        return $this->morphToMany(\App\Domains\Media\Models\Media::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'primary')
            ->withPivot(['display_order', 'is_required']);
    }

    public function downloadMedia()
    {
        return $this->morphToMany(\App\Domains\Media\Models\Media::class, 'entity', 'media_links')
            ->wherePivot('link_type', 'download')
            ->withPivot(['display_order', 'is_required']);
    }

    public function progress()
    {
        return $this->hasMany(\App\Domains\Learning\Models\LessonProgress::class);
    }

    public function studentProgress()
    {
        return $this->hasOne(\App\Domains\Learning\Models\LessonProgress::class)->where('user_id', auth('sanctum')->id() ?? 0);
    }

    public function dependencies()
    {
        return $this->hasMany(LessonDependency::class, 'lesson_id');
    }

    public function versions()
    {
        return $this->hasMany(LessonVersion::class)->orderBy('version', 'desc');
    }
}
