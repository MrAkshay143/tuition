<?php

namespace App\Domains\Core\Enums;

enum ConcurrentSessionPolicy: string
{
    case REPLACE_CURRENT     = 'REPLACE_CURRENT';
    case DENY_NEW            = 'DENY_NEW';
    case PROMPT_USER         = 'PROMPT_USER';
    case REMOVE_LEAST_RECENT = 'REMOVE_LEAST_RECENT';
}
