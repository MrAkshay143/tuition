<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Support\Query\IncludeParser;

class GetStudentAction
{
    public function execute(int $studentId, ?string $includes): User
    {
        $query = User::students();

        if ($includes) {
            IncludeParser::apply($query, $includes, ['batches', 'certificates', 'assignmentSubmissions']);
        } else {
            $query->with(['batches:id,name,color', 'certificates', 'assignmentSubmissions']);
        }

        return $query->findOrFail($studentId);
    }
}

