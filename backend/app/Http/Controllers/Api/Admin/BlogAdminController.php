<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\CMS\Repositories\BlogRepository;
use App\Domains\CMS\Services\BlogService;

class BlogAdminController extends Controller
{
    public function __construct(
        private BlogRepository $repository,
        private BlogService $service
    ) {}

    public function index(Request $request)
    {
        $perPage = $request->integer('per_page', 15);
        $filters = $request->only(['status', 'category_id']);
        
        $blogs = $this->repository->getAllPaginated($perPage, $filters);
        
        return response()->json($blogs);
    }

    public function show($id)
    {
        $blog = $this->repository->findById($id);
        return response()->json(['data' => $blog]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:blogs',
            'excerpt' => 'nullable|string',
            'body' => 'required|string',
            'cover_image' => 'nullable|string',
            'category_id' => 'nullable|exists:content_categories,id',
            'status' => 'required|in:draft,published,archived',
            'published_at' => 'nullable|date',
            'read_time' => 'nullable|string|max:50',
        ]);
        
        $validated['author_id'] = $request->user()->id ?? 1;

        $blog = $this->service->createBlog($validated);
        
        return response()->json(['data' => $blog, 'message' => 'Blog created successfully'], 201);
    }

    public function update(Request $request, $id)
    {
        $blog = $this->repository->findById($id);
        
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'excerpt' => 'nullable|string',
            'body' => 'sometimes|required|string',
            'cover_image' => 'nullable|string',
            'category_id' => 'nullable|exists:content_categories,id',
            'status' => 'sometimes|required|in:draft,published,archived',
            'published_at' => 'nullable|date',
            'read_time' => 'nullable|string|max:50',
        ]);

        $this->service->updateBlog($blog, $validated);
        
        return response()->json(['message' => 'Blog updated successfully', 'data' => $blog->fresh()]);
    }

    public function destroy($id)
    {
        $blog = $this->repository->findById($id);
        $this->repository->delete($blog);
        
        return response()->json(['message' => 'Blog deleted successfully']);
    }
}
