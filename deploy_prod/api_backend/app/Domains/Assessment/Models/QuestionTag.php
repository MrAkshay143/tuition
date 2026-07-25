<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionTag extends Model
{
    protected $fillable = ['name'];

    public function questions()
    {
        return $this->belongsToMany(Question::class);
    }
}
