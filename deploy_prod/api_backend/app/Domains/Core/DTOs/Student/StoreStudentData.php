<?php

namespace App\Domains\Core\DTOs\Student;

class StoreStudentData
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $phone = null,
    ) {}
}
