<?php

namespace App\Domains\CMS\Services;

use App\Domains\CMS\Repositories\BlogRepository;
use Illuminate\Support\Str;
use App\Domains\CMS\Models\Blog;

class BlogService
{
    public function __construct(private BlogRepository $repository)
    {
    }

    public function createBlog(array $data): Blog
    {
        if (empty($data['slug']) && !empty($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        
        // Ensure slug is unique
        $originalSlug = $data['slug'];
        $count = 1;
        while (Blog::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $originalSlug . '-' . $count;
            $count++;
        }

        return $this->repository->create($data);
    }

    public function updateBlog(Blog $blog, array $data): bool
    {
        if (!empty($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        
        if (isset($data['slug']) && $data['slug'] !== $blog->slug) {
            $originalSlug = $data['slug'];
            $count = 1;
            while (Blog::where('slug', $data['slug'])->where('id', '!=', $blog->id)->exists()) {
                $data['slug'] = $originalSlug . '-' . $count;
                $count++;
            }
        }

        return $this->repository->update($blog, $data);
    }
}
