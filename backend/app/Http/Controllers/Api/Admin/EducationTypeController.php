<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Academic\Models\EducationType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class EducationTypeController extends ApiController
{
    public function index(): JsonResponse
    {
        $types = EducationType::withCount('programs')
            ->withTrashed()
            ->orderBy('order_index')
            ->get();
        return $this->success($types, 'Education types retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100|unique:education_types,name',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
            'order_index' => 'integer|min:0',
        ]);
        $data['slug'] = Str::slug($data['name']);

        $type = EducationType::create($data);
        return $this->success($type, 'Education type created.');
    }

    public function show(int $id): JsonResponse
    {
        $type = EducationType::withCount('programs')->findOrFail($id);
        return $this->success($type);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $type = EducationType::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100|unique:education_types,name,' . $id,
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
            'order_index' => 'integer|min:0',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $type->update($data);
        return $this->success($type, 'Education type updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $type = EducationType::findOrFail($id);
        if ($type->programs()->exists()) {
            return $this->error('Cannot delete: has associated programs.', 422);
        }
        $type->delete();
        return $this->success(null, 'Education type deleted.');
    }

    public function restore(int $id): JsonResponse
    {
        $type = EducationType::withTrashed()->findOrFail($id);
        $type->restore();
        return $this->success($type, 'Education type restored.');
    }
}
