<?php

namespace App\Domains\Core\Helpers;

use Illuminate\Support\Str;

class UuidHelper
{
    public static function generate(): string
    {
        return (string) Str::uuid();
    }

    public static function isValid(string $uuid): bool
    {
        return Str::isUuid($uuid);
    }
}
