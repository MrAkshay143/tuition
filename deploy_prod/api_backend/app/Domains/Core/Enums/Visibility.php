<?php

namespace App\Domains\Core\Enums;

enum Visibility: string
{
    case PUBLIC = 'public';
    case PRIVATE = 'private';
    case PASSWORD_PROTECTED = 'password_protected';
}
