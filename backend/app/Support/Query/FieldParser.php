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

        $fields = array_filter(array_map('trim', explode(',', $fieldsStr)));

        if (!empty($allowedFields)) {
            foreach ($fields as $field) {
                if (!in_array($field, $allowedFields)) {
                    throw ValidationException::withMessages([
                        'fields' => ["Selecting field '{$field}' is not allowed. Allowed values: " . implode(', ', $allowedFields)]
                    ]);
                }
            }
        }

        // Always include 'id' to prevent breaking relations
        if (!in_array('id', $fields)) {
            $fields[] = 'id';
        }

        return $query->select($fields);
    }
}
