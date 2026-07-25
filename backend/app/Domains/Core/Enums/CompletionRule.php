<?php

namespace App\Domains\Core\Enums;

enum CompletionRule: string
{
    case WATCH_ALL = 'watch_all';
    case SUBMIT_ALL = 'submit_all';
    case PASS_ALL = 'pass_all';
}
