<?php

namespace App\Domains\Notification\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    protected $table = 'notification_preferences';
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'in_app', 'email', 'push',
        'live_class_reminder', 'assignment_due', 'exam_reminder', 'new_content',
    ];

    protected $casts = [
        'in_app'              => 'boolean',
        'email'               => 'boolean',
        'push'                => 'boolean',
        'live_class_reminder' => 'boolean',
        'assignment_due'      => 'boolean',
        'exam_reminder'       => 'boolean',
        'new_content'         => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Domains\Core\Models\User::class);
    }
}
