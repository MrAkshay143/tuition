<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Media\Models\ContentCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ContentCategoryController extends ApiController
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(ContentCategory::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|unique:content_categories,name|max:100',
        ]);

        $category = ContentCategory::create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
        ]);

        return $this->success($category, 'Category created successfully.', 201);
    }

    public function destroy(int $id): JsonResponse
    {
        ContentCategory::destroy($id);
        return $this->success(null, 'Category deleted successfully.');
    }
}
