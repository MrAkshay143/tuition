<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use App\Domains\Core\Models\User;
use App\Support\Query\QueryBuilder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class GetBatchesAction
{
    public function execute(?User $user = null, Request $request = null): LengthAwarePaginator
    {
        $request = $request ?? request();
        $query = Batch::query()
            ->withCount(['students', 'courses'])
            ->with(['teacher:id,name,email']);

        return QueryBuilder::for($query, $request)
            ->visibleTo($user)
            ->allowedIncludes(['students', 'courses', 'teacher'])
            ->allowedFilters(['is_active', 'teacher_id'])
            ->allowedSorts(['id', 'name', 'created_at'])
            ->defaultSort('created_at', 'desc')
            ->jsonPaginate();
    }
}

