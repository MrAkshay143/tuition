<?php

namespace App\Domains\Learning\Models;

use Illuminate\Database\Eloquent\Model;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\Batch;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'batch_id',
        'status',
        'enrolled_at',
        'expires_at',
    ];

    protected $casts = [
        'enrolled_at' => 'datetime',
        'expires_at'  => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }
}
