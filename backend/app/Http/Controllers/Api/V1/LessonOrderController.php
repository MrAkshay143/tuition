<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Actions\ReorderLessonsAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LessonOrderController extends ApiController
{
    use ApiResponse;

    protected ReorderLessonsAction $reorderAction;

    public function __construct(ReorderLessonsAction $reorderAction)
    {
        $this->reorderAction = $reorderAction;
    }

    /**
     * PATCH /api/v1/chapters/{chapterId}/lessons/reorder
     */
    public function __invoke(Request $request, int $chapterId): JsonResponse
    {
        $request->validate([
            'lessons'               => 'required|array',
            'lessons.*.id'          => 'required|integer|exists:lessons,id',
            'lessons.*.chapter_id'  => 'required|integer|exists:course_chapters,id',
            'lessons.*.sort_order'  => 'required|integer'
        ]);

        $this->reorderAction->execute($request->lessons);

        return $this->success(null, 'Lessons reordered successfully.');
    }
}
