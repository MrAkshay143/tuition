<?php

namespace App\Domains\Assessment\Models;

use Illuminate\Database\Eloquent\Model;

class Difficulty extends Model
{
    protected $fillable = ['name', 'level'];

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}
