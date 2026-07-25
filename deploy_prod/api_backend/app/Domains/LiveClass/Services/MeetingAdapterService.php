<?php

namespace App\Domains\LiveClass\Services;

use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Str;

class MeetingAdapterService
{
    /**
     * Generate meeting details based on the provider.
     */
    public function generateMeeting(string $provider, string $title): array
    {
        $meetingId = Str::random(10);
        $password = Str::random(6);

        $url = match (strtolower($provider)) {
            'zoom' => "https://zoom.us/j/{$meetingId}?pwd=" . Str::random(12),
            'google_meet' => "https://meet.google.com/" . strtolower(Str::random(3) . '-' . Str::random(4) . '-' . Str::random(3)),
            'livekit' => "https://livekit.eduflow.test/rooms/" . Str::slug($title) . '-' . Str::random(6),
            default => "https://meet.jit.si/" . Str::slug($title) . '-' . Str::random(6),
        };

        return [
            'meeting_id'  => $meetingId,
            'meeting_url' => $url,
            'password'    => $password,
        ];
    }
}
