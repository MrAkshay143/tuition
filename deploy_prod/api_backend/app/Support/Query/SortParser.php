<?php

namespace App\Support\Query;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class SortParser
{
    /**
     * Parse and validate sorts on query.
     */
    public static function apply(Builder $query, ?string $sortColumn, ?string $direction, array $allowedSorts, string $defaultSort = 'id'): Builder
    {
        $sortColumn = $sortColumn ?: $defaultSort;
        $direction = strtolower($direction ?: 'asc');

        if (!in_array($direction, ['asc', 'desc'])) {
            throw ValidationException::withMessages([
                'direction' => ["The sort direction must be 'asc' or 'desc'."]
            ]);
        }

        if (!in_array($sortColumn, $allowedSorts)) {
            throw ValidationException::withMessages([
                'sort' => ["Sorting by column '{$sortColumn}' is not allowed. Allowed values: " . implode(', ', $allowedSorts)]
            ]);
        }

        return $query->orderBy($sortColumn, $direction);
    }
}
