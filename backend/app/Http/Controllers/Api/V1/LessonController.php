<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Lesson;
use App\Domains\Course\Actions\CreateLessonAction;
use App\Domains\Course\Actions\UpdateLessonAction;
use App\Domains\Course\Actions\DeleteLessonAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LessonController extends \App\Http\Controllers\ApiController
{
    public function __construct(
        protected CreateLessonAction $createAction,
        protected UpdateLessonAction $updateAction,
        protected DeleteLessonAction $deleteAction
    ) {}

    /**
     * POST /api/v1/modules/{moduleId}/lessons (Legacy Backward Compatibility)
     */
    public function storeLegacy(
        \App\Domains\Course\Requests\StoreLessonRequest $request,
        int $moduleId
    ): JsonResponse {
        $validated = $request->validated();
        
        // Find the first chapter of the module, or create a dummy one if none exists
        $chapter = \App\Domains\Course\Models\CourseChapter::firstOrCreate(
            ['module_id' => $moduleId],
            ['title' => 'Default Chapter', 'sort_order' => 1]
        );
        
        $lesson = $this->createAction->execute([
            ...$validated,
            'chapter_id' => $chapter->id
        ]);

        return $this->success(
            new \App\Http\Resources\V1\LessonResource($lesson),
            'Lesson created successfully',
            201
        );
    }

    /**
     * POST /api/v1/chapters/{chapterId}/lessons
     */
    public function store(
        \App\Domains\Course\Requests\StoreLessonRequest $request,
        int $chapterId
    ): JsonResponse {
        $validated = $request->validated();
        
        $lesson = $this->createAction->execute([
            ...$validated,
            'chapter_id' => $chapterId
        ]);

        app(\App\Domains\Media\Services\MediaLinkService::class)->syncLessonLinks(
            $lesson,
            $validated['primary_media_id'] ?? null,
            $validated['download_media_id'] ?? null,
            $request->user()?->id ?? 1
        );

        return $this->success(
            data: $lesson,
            message: 'Lesson created successfully.',
            status: 201
        );
    }

    /**
     * PUT /api/v1/lessons/{id}
     */
    public function update(
        \App\Domains\Course\Requests\UpdateLessonRequest $request,
        int $id
    ): JsonResponse {
        $lesson = Lesson::findOrFail($id);
        $userId = $request->user()?->id ?? 1;
        $validated = $request->validated();
        
        $lesson = $this->updateAction->execute($lesson, $validated, $userId);

        app(\App\Domains\Media\Services\MediaLinkService::class)->syncLessonLinks(
            $lesson,
            $validated['primary_media_id'] ?? null,
            $validated['download_media_id'] ?? null,
            $userId
        );

        return $this->success(
            data: $lesson,
            message: 'Lesson updated successfully.'
        );
    }

    /**
     * PATCH /api/v1/lessons/{id}/autosave
     */
    public function autosave(
        \App\Domains\Course\Requests\AutosaveLessonRequest $request,
        int $id
    ): JsonResponse {
        $lesson = Lesson::findOrFail($id);
        
        $lesson->update($request->validated());

        return $this->success(
            data: $lesson,
            message: 'Draft saved.'
        );
    }

    /**
     * DELETE /api/v1/lessons/{id}
     */
    public function destroy(
        \App\Domains\Course\Requests\DeleteLessonRequest $request,
        int $id
    ): JsonResponse {
        $lesson = Lesson::findOrFail($id);
        $this->deleteAction->execute($lesson);

        return $this->success(null, 'Lesson deleted successfully.');
    }

    /**
     * GET /api/v1/public/lessons/{lesson}/stream  (free preview - no login needed)
     * GET /api/v1/lessons/{lesson}/stream         (locked - requires auth + enrollment)
     *
     * Rules:
     *  - Free preview lessons: anyone (guest or logged-in) can stream.
     *  - Locked lessons: must be admin, teacher, or have an active enrollment (direct or via batch).
     */
    public function stream(Request $request, Lesson $lesson): JsonResponse
    {
        $user = $request->user('sanctum') ?? $request->user();

        // ── Locked lesson guard ──────────────────────────────────────────────
        if (!$lesson->is_free_preview) {
            // Unauthenticated users are never allowed on locked lessons
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please log in to watch this lesson.',
                ], 401);
            }

            // Admin and teacher roles always have access
            $isPrivileged = in_array($user->role, ['admin', 'teacher']);

            if (!$isPrivileged) {
                $course = $lesson->chapter?->module?->course;
                $courseId = $course?->id;

                $accessService = app(\App\Domains\Core\Services\AcademicAccessService::class);
                $isEnrolled = $courseId ? $accessService->hasAccessToCourse($user, $courseId) : false;

                if (!$isEnrolled) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You are not enrolled in this course.',
                    ], 403);
                }
            }
        }

        // ── Fetch primary media asset and generate stream URL ────────────────
        $media = $lesson->primaryMedia()->first();

        if ($media) {
            $linkService = app(\App\Domains\Media\Services\MediaLinkService::class);
            $signedUrl = $linkService->generateSignedStreamUrl($media, 60);
        } else {
            $signedUrl = (!empty($lesson->video_url))
                ? $lesson->video_url
                : config('app.fallback_video_url', '');
        }

        return $this->success([
            'lesson_id'  => $lesson->id,
            'media_id'   => $media?->id,
            'stream_url' => $signedUrl,
            'expires_at' => now()->addMinutes(60)->toIso8601String(),
            'watermark'  => [
                'student_name'  => $user?->name  ?? 'Guest User',
                'student_email' => $user?->email ?? 'guest@eduflow.test',
                'ip_address'    => $request->ip(),
            ],
        ], 'Stream URL generated successfully');
    }
}
