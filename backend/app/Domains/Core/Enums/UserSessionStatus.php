<?php

namespace App\Domains\Core\Enums;

enum UserSessionStatus: string
{
    case ACTIVE      = 'ACTIVE';
    case REVOKED     = 'REVOKED';
    case EXPIRED     = 'EXPIRED';
    case COMPROMISED = 'COMPROMISED';
    case TERMINATED  = 'TERMINATED';
    case active      = 'active';
    case revoked     = 'revoked';
    case expired     = 'expired';
}
