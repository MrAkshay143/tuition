<?php

namespace App\Domains\Learning\Models;

use Illuminate\Database\Eloquent\Model;
use App\Domains\Core\Models\User;

class LearningStreak extends Model
{
    protected $fillable = [
        'user_id',
        'current_streak_days',
        'longest_streak_days',
        'last_activity_date',
    ];

    protected $casts = [
        'last_activity_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
