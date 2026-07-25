<?php

namespace App\Domains\Core\Actions\Student;

use App\Models\User;
use App\Models\ActivityLog;
use App\Domains\Notification\Models\Notification;
use Illuminate\Support\Str;

class SendStudentNotificationAction
{
    public function execute(int $studentId, string $title, string $body): void
    {
        $student = User::students()->findOrFail($studentId);

        Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $student->id,
            'title' => $title,
            'body' => $body,
            'read_at' => null,
        ]);

        ActivityLog::record('notification_sent', "Sent notification to student: {$student->name}");
    }
}
