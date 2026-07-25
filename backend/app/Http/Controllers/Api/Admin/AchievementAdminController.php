<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\CMS\Repositories\AchievementRepository;
use App\Domains\CMS\Services\AchievementService;

class AchievementAdminController extends Controller
{
    public function __construct(
        private AchievementRepository $repository,
        private AchievementService $service
    ) {}

    public function index(Request $request)
    {
        $perPage = $request->integer('per_page', 15);
        $filters = $request->only(['is_published']);
        
        $achievements = $this->repository->getAllPaginated($perPage, $filters);
        
        return response()->json($achievements);
    }

    public function show($id)
    {
        $achievement = $this->repository->findById($id);
        return response()->json(['data' => $achievement]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_name' => 'required|string|max:255',
            'exam_name' => 'required|string|max:255',
            'rank' => 'nullable|string|max:50',
            'score' => 'nullable|string|max:50',
            'year' => 'required|integer',
            'image' => 'nullable|string',
            'testimonial' => 'nullable|string',
            'batch_id' => 'nullable|exists:batches,id',
            'is_published' => 'boolean',
        ]);

        $achievement = $this->service->createAchievement($validated);
        
        return response()->json(['data' => $achievement, 'message' => 'Achievement created successfully'], 201);
    }

    public function update(Request $request, $id)
    {
        $achievement = $this->repository->findById($id);
        
        $validated = $request->validate([
            'student_name' => 'sometimes|required|string|max:255',
            'exam_name' => 'sometimes|required|string|max:255',
            'rank' => 'nullable|string|max:50',
            'score' => 'nullable|string|max:50',
            'year' => 'sometimes|required|integer',
            'image' => 'nullable|string',
            'testimonial' => 'nullable|string',
            'batch_id' => 'nullable|exists:batches,id',
            'is_published' => 'boolean',
        ]);

        $this->service->updateAchievement($achievement, $validated);
        
        return response()->json(['message' => 'Achievement updated successfully', 'data' => $achievement->fresh()]);
    }

    public function destroy($id)
    {
        $achievement = $this->repository->findById($id);
        $this->repository->delete($achievement);
        
        return response()->json(['message' => 'Achievement deleted successfully']);
    }
}
