<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    protected $fillable = ['subject_id', 'name', 'description'];

    public function subject()
    {
        return $this->belongsTo(\App\Domains\Academic\Models\Subject::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}
