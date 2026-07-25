<?php

namespace App\Domains\CMS\Repositories;

use App\Domains\CMS\Models\Blog;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class BlogRepository
{
    public function getAllPaginated(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Blog::with(['author', 'category'])->latest('published_at');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?Blog
    {
        return Blog::with(['author', 'category'])->findOrFail($id);
    }
    
    public function findBySlug(string $slug): ?Blog
    {
        return Blog::with(['author', 'category'])->where('slug', $slug)->firstOrFail();
    }

    public function create(array $data): Blog
    {
        return Blog::create($data);
    }

    public function update(Blog $blog, array $data): bool
    {
        return $blog->update($data);
    }

    public function delete(Blog $blog): bool
    {
        return $blog->delete();
    }
}
