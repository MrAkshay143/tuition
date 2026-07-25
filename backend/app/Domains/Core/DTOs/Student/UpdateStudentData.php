<?php

namespace App\Domains\Core\DTOs\Student;

class UpdateStudentData
{
    public function __construct(
        public readonly int $id,
        public readonly ?string $name = null,
        public readonly ?string $email = null,
        public readonly ?string $password = null,
        public readonly ?string $phone = null,
    ) {}
}
