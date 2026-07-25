<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use App\Domains\Notification\Models\Notification;
use Illuminate\Support\Str;

class SendStudentNotificationAction
{
    public function execute(int $studentId, string $title, string $body): void
    {
        $student = User::students()->findOrFail($studentId);

        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->send($student, 'system', $title, $body);

        ActivityLog::record('notification_sent', "Sent notification to student: {$student->name}");
    }
}

