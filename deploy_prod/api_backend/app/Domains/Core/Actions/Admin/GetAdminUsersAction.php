<?php

namespace App\Domains\Core\Actions\Admin;

use App\Domains\Core\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetAdminUsersAction
{
    public function execute(array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->when($filters['search'] ?? null, fn($q, $s) => $q->where(fn($q2) =>
                $q2->where('name', 'like', "%$s%")->orWhere('email', 'like', "%$s%")
            ))
            ->when(($filters['role'] ?? null) && $filters['role'] !== 'all', fn($q) => $q->where('role', $filters['role']));

        return $query->latest()->paginate(min(max((int)($filters['per_page'] ?? 25), 1), 100));
    }
}
