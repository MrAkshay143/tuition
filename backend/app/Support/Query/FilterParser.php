<?php

namespace App\Support\Query;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class FilterParser
{
    /**
     * Parse and validate filters on query.
     */
    public static function apply(Builder $query, ?array $filters, array $allowedFilters): Builder
    {
        if (empty($filters)) {
            return $query;
        }

        foreach ($filters as $key => $value) {
            if (!in_array($key, $allowedFilters)) {
                throw ValidationException::withMessages([
                    "filter.{$key}" => ["Filtering by '{$key}' is not allowed. Allowed values: " . implode(', ', $allowedFilters)]
                ]);
            }

            if ($value !== null && $value !== '') {
                $scopeName = \Illuminate\Support\Str::camel($key);
                if ($query->getModel()->hasNamedScope($scopeName)) {
                    $query->{$scopeName}($value);
                } else {
                    $query->where($key, $value);
                }
            }
        }

        return $query;
    }
}
