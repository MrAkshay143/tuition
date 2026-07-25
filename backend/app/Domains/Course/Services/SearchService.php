<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Course;
use Illuminate\Database\Eloquent\Collection;

class SearchService
{
    public function search(string $query): Collection
    {
        return Course::where('title', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->where('status', 'published')
            ->get();
    }
}
