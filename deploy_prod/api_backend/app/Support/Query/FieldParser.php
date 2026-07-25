<?php

namespace App\Support\Query;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class FieldParser
{
    /**
     * Parse and validate fields on query.
     */
    public static function apply(Builder $query, ?string $fieldsStr, array $allowedFields): Builder
    {
        if (empty($fieldsStr)) {
            return $query;
        }

        $fields = explode(',', $fieldsStr);
        $validated = [];

        foreach ($fields as $field) {
            $field = trim($field);
            if (!in_array($field, $allowedFields)) {
                throw ValidationException::withMessages([
                    'fields' => ["Selecting field '{$field}' is not allowed. Allowed values: " . implode(', ', $allowedFields)]
                ]);
            }
            $validated[] = $field;
        }

        // Always include 'id' to prevent breaking relations
        if (!in_array('id', $validated)) {
            $validated[] = 'id';
        }

        return $query->select($validated);
    }
}
