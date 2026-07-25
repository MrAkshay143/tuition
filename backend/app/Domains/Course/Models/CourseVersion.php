<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;

class CourseVersion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'course_id', 'version', 'snapshot', 'change_summary', 'created_by'
    ];

    protected $casts = [
        'snapshot'   => 'array',
        'created_at' => 'datetime'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function creator()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'created_by');
    }
}
