<?php

namespace App\Domains\Core\Contracts;

interface MeetingProviderInterface
{
    /**
     * Create a new meeting instance.
     */
    public function createMeeting(array $data): array;

    /**
     * Get join URL for students.
     */
    public function getJoinUrl(string $meetingId): string;

    /**
     * Get host URL for teachers.
     */
    public function getHostUrl(string $meetingId): string;

    /**
     * Cancel an existing meeting.
     */
    public function cancelMeeting(string $meetingId): bool;
}
