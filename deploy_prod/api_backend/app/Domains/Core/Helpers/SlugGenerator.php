<?php

namespace App\Domains\Core\Helpers;

use Illuminate\Support\Str;

class SlugGenerator
{
    public static function make(string $title): string
    {
        return Str::slug($title);
    }
}
