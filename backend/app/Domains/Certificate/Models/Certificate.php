<?php

namespace App\Domains\Certificate\Models;

use Illuminate\Database\Eloquent\Model;

use App\Support\Traits\HasOwner;

class Certificate extends Model
{
    use HasOwner;
    protected $fillable = [
        'user_id', 'course_id', 'exam_attempt_id', 'type',
        'certificate_no', 'pdf_url', 'qr_code', 'issued_at',
    ];
    protected $casts = ['issued_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class);
    }

    public function course()
    {
        return $this->belongsTo(\App\Domains\Course\Models\Course::class);
    }
}
