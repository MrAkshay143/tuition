<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Support\Query\IncludeParser;

class GetCourseAction
{
    public function execute(int $courseId, ?string $includes): Course
    {
        $query = Course::query();

        if ($includes) {
            IncludeParser::apply($query, $includes, ['modules', 'modules.lessons', 'modules.chapters', 'modules.chapters.lessons', 'teacher']);
        } else {
            $query->with(['modules.lessons', 'modules.chapters.lessons']);
        }

        return $query->findOrFail($courseId);
    }
}
