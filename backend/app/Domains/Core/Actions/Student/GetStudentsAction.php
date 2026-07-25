<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Support\Query\QueryBuilder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class GetStudentsAction
{
    public function execute(?User $user = null, ?Request $request = null): LengthAwarePaginator
    {
        $request = $request ?? request();
        $query = User::students()->with(['batches:id,name,color', 'courses:id,title']);

        if ($user && $user->role === 'teacher') {
            $query->whereHas('batches', fn($b) => $b->where('teacher_id', $user->id));
        }

        return QueryBuilder::for($query, $request)
            ->allowedIncludes(['batches', 'courses', 'progress', 'certificates', 'assignmentSubmissions'])
            ->allowedFields(['id', 'name', 'email', 'phone', 'avatar', 'active', 'last_login_at', 'created_at', 'role'])
            ->allowedFilters(['active'])
            ->allowedSorts(['id', 'name', 'created_at'])
            ->defaultSort('created_at', 'desc')
            ->jsonPaginate();
    }
}

