<?php

namespace App\Support\Query;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class IncludeParser
{
    /**
     * Parse and validate includes on query.
     */
    public static function apply(Builder $query, ?string $includeStr, array $allowedIncludes, int $maxDepth = 3): Builder
    {
        if (empty($includeStr)) {
            return $query;
        }

        $includes = explode(',', $includeStr);
        $validated = [];

        foreach ($includes as $include) {
            $include = trim($include);
            
            // Check depth limit
            if (substr_count($include, '.') >= $maxDepth) {
                throw ValidationException::withMessages([
                    'include' => ["The include chain depth of '{$include}' exceeds the max depth limit of {$maxDepth}."]
                ]);
            }

            if (!in_array($include, $allowedIncludes)) {
                throw ValidationException::withMessages([
                    'include' => ["The include '{$include}' is not allowed. Allowed values: " . implode(', ', $allowedIncludes)]
                ]);
            }

            $validated[] = $include;
        }

        return $query->with($validated);
    }
}
