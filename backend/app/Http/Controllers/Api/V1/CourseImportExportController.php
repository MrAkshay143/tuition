<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Actions\ExportCourseAction;
use App\Domains\Course\Actions\ImportCourseAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Gate;

class CourseImportExportController extends ApiController
{
    use ApiResponse;

    protected ExportCourseAction $exportAction;
    protected ImportCourseAction $importAction;

    public function __construct(ExportCourseAction $exportAction, ImportCourseAction $importAction)
    {
        $this->exportAction = $exportAction;
        $this->importAction = $importAction;
    }

    /**
     * GET /api/v1/courses/{id}/export
     */
    public function export(int $id)
    {
        $course = Course::findOrFail($id);
        Gate::authorize('view', $course);

        $payload = $this->exportAction->execute($course);
        $fileName = Str::slug($course->title) . '.eduflow';

        return response()->json($payload, 200, [
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Content-Type'        => 'application/json',
        ]);
    }

    /**
     * POST /api/v1/courses/import
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file',
        ]);

        $file = $request->file('file');
        $raw = file_get_contents($file->getRealPath());
        $payload = json_decode($raw, true);

        if (!$payload || !isset($payload['schema_version'])) {
            return $this->error('Invalid package format. Must be a valid .eduflow course snapshot.', 422);
        }

        $teacherId = $request->user()?->id ?? 1;
        $course = $this->importAction->execute($payload, $teacherId);

        return $this->success($course, 'Course imported successfully.', 201);
    }
}
