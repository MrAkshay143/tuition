<?php

namespace App\Domains\Core\Providers;

use App\Domains\Core\Contracts\MeetingProviderInterface;
use Illuminate\Support\Str;

class ManualUrlMeetingProvider implements MeetingProviderInterface
{
    protected string $provider;

    public function __construct(string $provider)
    {
        $this->provider = $provider;
    }

    public function createMeeting(array $data): array
    {
        $meetingId = Str::random(10);
        $url = $data['join_url'] ?? $data['meeting_url'] ?? '';

        if (empty($url)) {
            throw new \Exception("A valid meeting URL is required for manual provider.");
        }

        return [
            'meeting_id'  => $meetingId,
            'meeting_url' => $url,
            'host_link'   => $url,
            'password'    => $data['password'] ?? '',
        ];
    }

    public function getJoinUrl(string $meetingId): string
    {
        return "";
    }

    public function getHostUrl(string $meetingId): string
    {
        return "";
    }

    public function cancelMeeting(string $meetingId): bool
    {
        return true;
    }
}
