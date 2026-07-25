<?php

namespace App\Domains\Course\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Support\Query\QueryBuilder;
use Illuminate\Http\Request;

class GetCoursesAction
{
    public function execute(?User $user = null, Request $request = null): LengthAwarePaginator
    {
        $request = $request ?? request();
        $query = Course::query()
            ->withCount(['modules', 'enrollments'])
            ->with(['teacher:id,name,avatar']);

        return QueryBuilder::for($query, $request)
            ->visibleTo($user)
            ->allowedIncludes(['modules', 'modules.lessons', 'modules.chapters', 'modules.chapters.lessons', 'teacher'])
            ->allowedFilters([
                'status', 
                'teacher_id', 
                'program_id', 
                'education_type_id'
            ])
            ->allowedSorts(['id', 'title', 'created_at'])
            ->defaultSort('created_at', 'desc')
            ->jsonPaginate();
    }
}
