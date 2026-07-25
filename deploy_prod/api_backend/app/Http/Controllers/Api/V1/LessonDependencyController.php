<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Lesson;
use App\Domains\Course\Models\LessonDependency;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LessonDependencyController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/v1/lessons/{id}/dependencies
     */
    public function store(Request $request, int $lessonId): JsonResponse
    {
        $request->validate([
            'prerequisite_lesson_id' => 'required|exists:lessons,id',
        ]);

        $prereqId = $request->input('prerequisite_lesson_id');

        if ($lessonId === (int)$prereqId) {
            return $this->error('A lesson cannot depend on itself.', 422);
        }

        $dependency = LessonDependency::firstOrCreate([
            'lesson_id'              => $lessonId,
            'prerequisite_lesson_id' => $prereqId,
        ]);

        return $this->success($dependency, 'Lesson prerequisite dependency added successfully.', 201);
    }

    /**
     * DELETE /api/v1/lessons/{id}/dependencies/{prerequisiteId}
     */
    public function destroy(int $lessonId, int $prerequisiteId): JsonResponse
    {
        LessonDependency::where([
            'lesson_id'              => $lessonId,
            'prerequisite_lesson_id' => $prerequisiteId,
        ])->delete();

        return $this->success(null, 'Lesson prerequisite dependency removed successfully.');
    }
}
