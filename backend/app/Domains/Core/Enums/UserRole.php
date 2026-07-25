<?php

namespace App\Domains\Core\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case TEACHER = 'teacher';
    case STUDENT = 'student';
}
