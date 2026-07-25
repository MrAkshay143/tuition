<?php

namespace App\Domains\Core\Helpers;

use Illuminate\Support\Facades\Cache;

class Idempotency
{
    public static function checkAndLock(string $key, int $ttlSeconds = 5): bool
    {
        return Cache::lock($key, $ttlSeconds)->get();
    }

    public static function unlock(string $key): void
    {
        Cache::lock($key)->release();
    }
}
