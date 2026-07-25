<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Domains\Learning\Services\BookmarkService;
use App\Domains\Learning\Models\StudentBookmark;

class BookmarkController extends Controller
{
    protected $bookmarkService;

    public function __construct(BookmarkService $bookmarkService)
    {
        $this->bookmarkService = $bookmarkService;
    }

    /**
     * GET /api/v1/student/bookmarks
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $bookmarks = StudentBookmark::where('user_id', $user->id)
            ->with(['lesson.module.course'])
            ->get();

        return response()->json([
            'data' => $bookmarks
        ]);
    }

    /**
     * POST /api/v1/lessons/{lesson}/bookmark
     */
    public function store(\App\Domains\Core\Requests\StoreBookmarkRequest $request, int $lessonId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validated();

        $bookmark = $this->bookmarkService->addBookmark(
            $user,
            $lessonId,
            $validated['video_timestamp_seconds'] ?? null,
            $validated['note'] ?? null
        );

        return response()->json([
            'message' => 'Bookmark saved successfully',
            'data'    => $bookmark
        ]);
    }

    /**
     * DELETE /api/v1/lessons/{lesson}/bookmark
     */
    public function destroy(Request $request, int $lessonId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $success = $this->bookmarkService->removeBookmark($user, $lessonId);

        if (!$success) {
            return response()->json(['message' => 'Bookmark not found'], 404);
        }

        return response()->json([
            'message' => 'Bookmark removed successfully'
        ]);
    }
}

