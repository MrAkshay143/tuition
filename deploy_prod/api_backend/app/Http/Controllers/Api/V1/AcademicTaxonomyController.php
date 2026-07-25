<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Domains\Academic\Models\EducationType;
use App\Domains\Academic\Models\Program;
use App\Domains\Academic\Models\Subject;

class AcademicTaxonomyController extends Controller
{
    /**
     * GET /api/v1/academic-taxonomy
     * Returns the full hierarchy with aggregated course counts for Phase 3L search filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $educationTypes = EducationType::with(['programs' => function($q) {
            $q->withCount('courses');
        }])->get();

        $subjects = Subject::withCount('courses')->get();

        $data = $educationTypes->map(function ($type) {
            $programs = $type->programs->map(function ($program) {
                return [
                    'id' => $program->id,
                    'name' => $program->name,
                    'courses_count' => $program->courses_count,
                ];
            });

            return [
                'id' => $type->id,
                'name' => $type->name,
                'total_courses_count' => $programs->sum('courses_count'),
                'programs' => $programs,
            ];
        });

        $subjectsData = $subjects->map(function ($subject) {
            return [
                'id' => $subject->id,
                'name' => $subject->name,
                'courses_count' => $subject->courses_count,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'education_types' => $data,
                'subjects' => $subjectsData,
            ]
        ]);
    }
}
