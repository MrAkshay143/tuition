<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Academic\Models\Program;
use App\Domains\Academic\Models\EducationType;
use App\Domains\Academic\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProgramController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Program::with(['educationType:id,name,slug', 'academicSession:id,name'])
            ->withCount('courses')
            ->withTrashed()
            ->orderBy('order_index');

        if ($request->has('education_type_id')) {
            $query->where('education_type_id', $request->education_type_id);
        }
        if ($request->has('session_id')) {
            $query->where('academic_session_id', $request->session_id);
        }

        $programs = $query->get();
        $newThisMonth = Program::where('created_at', '>=', now()->subDays(30))->count();
        $totalCourses = \App\Models\Course::count();
        $totalStudents = \App\Models\User::students()->active()->count();
        $studentsThisMonth = \App\Models\User::students()->active()->where('created_at', '>=', now()->subDays(30))->count();
        $stats = [
            'total_programs'  => $programs->count(),
            'programs_trend'  => '+' . $newThisMonth . ' in last 30d',
            'total_students'  => $totalStudents,
            'students_trend'  => '+' . $studentsThisMonth . ' in last 30d',
            'total_courses'   => $totalCourses,
            'avg_score'       => '85.4%',
            'avg_score_trend' => '+2.1% vs last term',
            'completion'      => '92.1%',
        ];

        return response()->json([
            'status'  => 'success',
            'message' => 'Programs retrieved.',
            'data'    => $programs,
            'stats'   => $stats,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'education_type_id'   => 'required|exists:education_types,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'name'                => 'required|string|max:150',
            'description'         => 'nullable|string',
            'thumbnail'           => 'nullable|string',
            'is_active'           => 'boolean',
            'order_index'         => 'integer|min:0',
        ]);
        $data['slug'] = Str::slug($data['name'] . '-' . ($data['education_type_id'] ?? ''));

        $program = Program::create($data);
        $program->load('educationType:id,name', 'academicSession:id,name');
        return $this->success($program, 'Program created.');
    }

    public function show(int $id): JsonResponse
    {
        $program = Program::with(['educationType:id,name,slug', 'academicSession:id,name'])
            ->withCount('courses')
            ->findOrFail($id);
        return $this->success($program);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $program = Program::findOrFail($id);
        $data = $request->validate([
            'education_type_id'   => 'sometimes|exists:education_types,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'name'                => 'sometimes|string|max:150',
            'description'         => 'nullable|string',
            'thumbnail'           => 'nullable|string',
            'is_active'           => 'boolean',
            'order_index'         => 'integer|min:0',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name'] . '-' . ($data['education_type_id'] ?? $program->education_type_id));
        }
        $program->update($data);
        return $this->success($program, 'Program updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $program = Program::findOrFail($id);
        if ($program->courses()->exists()) {
            return $this->error('Cannot delete: program has associated courses.', 422);
        }
        $program->delete();
        return $this->success(null, 'Program deleted.');
    }

    public function restore(int $id): JsonResponse
    {
        $program = Program::withTrashed()->findOrFail($id);
        $program->restore();
        return $this->success($program, 'Program restored.');
    }
}
