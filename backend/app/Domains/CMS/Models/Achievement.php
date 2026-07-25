<?php

namespace App\Domains\CMS\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Domains\Core\Models\Batch; // Based on Core domain existence

class Achievement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_name',
        'exam_name',
        'rank',
        'score',
        'year',
        'image',
        'testimonial',
        'batch_id',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }
}
