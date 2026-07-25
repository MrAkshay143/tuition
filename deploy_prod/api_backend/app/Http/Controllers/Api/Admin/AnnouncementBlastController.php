<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Domains\Core\Models\Announcement;
use App\Models\User;
use App\Models\ActivityLog;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;


class AnnouncementBlastController extends Controller
{
    /**
     * POST /admin/announcement-blast
     *
     * Channels: in_app | email | push (FCM)
     * Recipients: all students OR specific batch_ids
     */
    public function send(Request $request)
    {
        $data = $request->validate([
            'title'      => 'required|string|min:3|max:200',
            'body'       => 'required|string|min:10',
            'type'       => 'required|string',
            'is_all'     => 'required|boolean',
            'channels'   => 'required|array|min:1',
            'channels.*' => 'in:in_app,email,push',
            'batch_ids'  => 'nullable|array',
            'batch_ids.*'=> 'exists:batches,id',
        ]);

        // Determine target users
        $query = User::students()->active();
        if (!$data['is_all'] && !empty($data['batch_ids'])) {
            $query->whereHas('batches', fn($q) => $q->whereIn('batches.id', $data['batch_ids']));
        }
        $students = $query->get();

        // Save announcement record
        $announcement = Announcement::create([
            'title'      => $data['title'],
            'body'       => $data['body'],
            'type'       => $data['type'],
            'is_all'     => $data['is_all'],
            'channels'   => $data['channels'],
            'created_by' => auth()->id(),
            'sent_at'    => now(),
        ]);

        if (!$data['is_all'] && !empty($data['batch_ids'])) {
            $announcement->batches()->sync($data['batch_ids']);
        }

        // Send via NotificationService (handles in_app + push + user prefs)
        $notifService = app(NotificationService::class);
        $notifService->send(
            $students,
            $data['type'],
            $data['title'],
            $data['body'],
            ['announcement_id' => $announcement->id],
            $data['channels'],
        );

        ActivityLog::record('created', "Sent announcement blast to {$students->count()} students: {$data['title']}");

        return response()->json([
            'message' => "Announcement sent to {$students->count()} students.",
            'data'    => $announcement,
        ]);

    }

    private function getIcon(string $type): string
    {
        return match($type) {
            'homework'       => 'homework',
            'holiday'        => 'holiday',
            'exam_reminder'  => 'exam',
            'live_reminder'  => 'live_class',
            'new_course'     => 'course',
            'new_notes'      => 'notes',
            'new_video'      => 'video',
            default          => 'announcement',
        };
    }
}
