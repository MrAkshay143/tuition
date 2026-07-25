<?php

namespace App\Domains\Core\DTOs\Student;

class AssignStudentCourseData
{
    public function __construct(
        public readonly int $studentId,
        public readonly array $courseIds,
    ) {}
}
