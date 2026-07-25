<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Course\Models\Lesson;
use App\Domains\Course\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LessonProgressController extends Controller
{
    /**
     * POST /api/v1/lessons/{id}/progress
     */
    public function updateProgress(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $lesson = Lesson::findOrFail($id);
        
        $progress = LessonProgress::updateOrCreate(
            [
                'user_id'   => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'watched_seconds' => $request->input('watched_seconds', 0),
                'completed'       => $request->input('completed', false),
                'completed_at'    => $request->input('completed') ? now() : null,
            ]
        );

        return response()->json([
            'message' => 'Progress updated',
            'data'    => $progress
        ]);
    }
}
