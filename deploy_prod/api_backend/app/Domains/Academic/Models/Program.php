<?php

namespace App\Domains\Academic\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Domains\Course\Models\Course;

class Program extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'education_type_id',
        'academic_session_id',
        'name',
        'slug',
        'description',
        'thumbnail',
        'is_active',
        'order_index',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    public function educationType()
    {
        return $this->belongsTo(EducationType::class, 'education_type_id');
    }

    public function academicSession()
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function courses()
    {
        return $this->hasMany(Course::class, 'program_id');
    }
}
