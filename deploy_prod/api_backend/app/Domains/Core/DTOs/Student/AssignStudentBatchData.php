<?php

namespace App\Domains\Core\DTOs\Student;

class AssignStudentBatchData
{
    public function __construct(
        public readonly int $studentId,
        public readonly array $batchIds,
    ) {}
}
