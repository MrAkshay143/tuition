<?php

namespace App\Domains\Course\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleState extends Model
{
    protected $fillable = [
        'teacher_id', 'module_id', 'collapsed'
    ];

    protected $casts = [
        'collapsed' => 'boolean'
    ];

    public function teacher()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class, 'teacher_id');
    }

    public function module()
    {
        return $this->belongsTo(CourseModule::class, 'module_id');
    }
}
