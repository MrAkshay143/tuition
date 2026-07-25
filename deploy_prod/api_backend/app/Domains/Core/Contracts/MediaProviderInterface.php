<?php

namespace App\Domains\Core\Contracts;

interface MediaProviderInterface
{
    public function getStreamingUrl(string $id): string;
    public function getDuration(string $id): int;
}
