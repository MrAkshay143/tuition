<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Academic\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class SubjectController extends ApiController
{
    public function index(): JsonResponse
    {
        $subjects = Subject::withCount('courses')
            ->withTrashed()
            ->orderBy('order_index')
            ->get();
        return $this->success($subjects, 'Subjects retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100|unique:subjects,name',
            'code'        => 'nullable|string|max:20',
            'color'       => 'nullable|string|max:20',
            'is_active'   => 'boolean',
            'order_index' => 'integer|min:0',
        ]);
        $data['slug'] = Str::slug($data['name']);

        $subject = Subject::create($data);
        return $this->created($subject, 'Subject created.');
    }

    public function show(int $id): JsonResponse
    {
        $subject = Subject::withCount('courses')->findOrFail($id);
        return $this->success($subject);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100|unique:subjects,name,' . $id,
            'code'        => 'nullable|string|max:20',
            'color'       => 'nullable|string|max:20',
            'is_active'   => 'boolean',
            'order_index' => 'integer|min:0',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $subject->update($data);
        return $this->success($subject, 'Subject updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $subject->delete();
        return $this->success(null, 'Subject deleted.');
    }

    public function restore(int $id): JsonResponse
    {
        $subject = Subject::withTrashed()->findOrFail($id);
        $subject->restore();
        return $this->success($subject, 'Subject restored.');
    }
}
