<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\CMS\Repositories\BlogRepository;

class BlogController extends Controller
{
    public function __construct(private BlogRepository $repository) {}

    public function index(Request $request)
    {
        $perPage = $request->integer('per_page', 10);
        // Only fetch published blogs for public API
        $filters = $request->only(['category_id']);
        $filters['status'] = 'published';
        
        $blogs = $this->repository->getAllPaginated($perPage, $filters);
        
        return response()->json($blogs);
    }

    public function show($slug)
    {
        $blog = $this->repository->findBySlug($slug);
        
        // Ensure it's published or the user is admin
        if ($blog->status !== 'published') {
            abort(404, 'Blog not found');
        }

        return response()->json(['data' => $blog]);
    }
}
