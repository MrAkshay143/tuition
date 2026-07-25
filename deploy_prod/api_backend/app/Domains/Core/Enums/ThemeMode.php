<?php

namespace App\Domains\Core\Enums;

enum ThemeMode: string
{
    case LIGHT = 'light';
    case DARK = 'dark';
    case SYSTEM = 'system';
}
