<?php

namespace App\Domains\Core\Contracts;

interface NotificationProviderInterface
{
    public function send(string $channel, $recipient, string $title, string $body, array $data = []): bool;
}
