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
     * GET /api/v1/lessons/{lesson}/stream
     * Authorizes enrollment and returns expirable signed stream URL.
     */
    public function stream(Request $request, Lesson $lesson): JsonResponse
    {
        $user = $request->user();

        // 1. Authorize enrollment via CoursePolicy
        $course = $lesson->chapter?->module?->course;
        if ($course) {
            $this->authorize('viewLesson', $course);
        }

        // 2. Fetch primary media asset for lesson
        $media = $lesson->media()->wherePivot('link_type', 'primary')->first();
        if (!$media) {
            return $this->error('Lesson does not contain a primary media asset.', 404);
        }

        // 3. Generate expirable Cloudflare R2 / S3 signed stream URL
        $linkService = app(\App\Domains\Media\Services\MediaLinkService::class);
        $signedUrl = $linkService->generateSignedStreamUrl($media, 60);

        return $this->success([
            'lesson_id'    => $lesson->id,
            'media_id'     => $media->id,
            'stream_url'   => $signedUrl,
            'expires_at'   => now()->addMinutes(60)->toIso8601String(),
            'watermark'    => [
                'student_name'  => $user->name,
                'student_email' => $user->email,
                'ip_address'    => $request->ip(),
            ],
        ], 'Stream URL generated successfully');
    }
}
