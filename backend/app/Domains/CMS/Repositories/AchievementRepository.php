<?php

namespace App\Domains\CMS\Repositories;

use App\Domains\CMS\Models\Achievement;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AchievementRepository
{
    public function getAllPaginated(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Achievement::with(['batch'])->orderBy('year', 'desc')->orderBy('rank', 'asc');

        if (isset($filters['is_published'])) {
            $query->where('is_published', $filters['is_published']);
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?Achievement
    {
        return Achievement::with(['batch'])->findOrFail($id);
    }

    public function create(array $data): Achievement
    {
        return Achievement::create($data);
    }

    public function update(Achievement $achievement, array $data): bool
    {
        return $achievement->update($data);
    }

    public function delete(Achievement $achievement): bool
    {
        return $achievement->delete();
    }
}
