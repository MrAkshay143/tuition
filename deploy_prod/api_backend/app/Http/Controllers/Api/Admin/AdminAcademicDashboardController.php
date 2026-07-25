<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Academic\Models\EducationType;
use App\Domains\Academic\Models\Program;
use App\Domains\Academic\Models\Subject;
use App\Domains\Academic\Models\AcademicSession;
use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\Batch;
use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AdminAcademicDashboardController extends ApiController
{
    /**
     * GET /api/v1/admin/academic/dashboard-stats
     *
     * Returns taxonomy-linked counts and breakdowns for the admin academic dashboard.
     */
    public function getStats(): \Illuminate\Http\JsonResponse
    {
        $stats = Cache::remember('admin.academic.dashboard_stats', 120, function () {

            // ── Top-level counts ─────────────────────────────────────────────
            $totalPrograms     = Program::count();
            $activePrograms    = Program::where('is_active', true)->count();
            $totalSubjects     = Subject::count();
            $totalSessions     = AcademicSession::count();
            $currentSession    = AcademicSession::where('is_current', true)->first();
            $totalCourses      = Course::count();
            $publishedCourses  = Course::where('status', 'published')->count();
            $draftCourses      = Course::where('status', 'draft')->count();
            $totalBatches      = Batch::count();

            // ── Courses by Education Type ─────────────────────────────────────
            $coursesByType = EducationType::withCount([
                'programs',
                'programs as active_programs_count' => fn($q) => $q->where('is_active', true),
            ])->get()->map(function ($et) {
                $courseCount = Course::whereHas('program', fn($q) => $q->where('education_type_id', $et->id))->count();
                return [
                    'id'                   => $et->id,
                    'name'                 => $et->name,
                    'slug'                 => $et->slug,
                    'is_active'            => $et->is_active,
                    'programs_count'       => $et->programs_count,
                    'active_programs_count'=> $et->active_programs_count,
                    'courses_count'        => $courseCount,
                ];
            });

            // ── Courses without taxonomy (missing program_id or subject_id) ──
            $coursesWithoutProgram = Course::whereNull('program_id')->count();
            $coursesWithoutSubject = Course::whereNull('subject_id')->count();

            // ── Enrollment counts ─────────────────────────────────────────────
            $totalEnrollments = DB::table('batch_student')->count();
            $totalStudents    = User::where('role', 'student')->count();

            return [
                'summary' => [
                    'education_types'      => EducationType::count(),
                    'programs'             => $totalPrograms,
                    'active_programs'      => $activePrograms,
                    'subjects'             => $totalSubjects,
                    'sessions'             => $totalSessions,
                    'current_session'      => $currentSession?->name,
                    'total_courses'        => $totalCourses,
                    'published_courses'    => $publishedCourses,
                    'draft_courses'        => $draftCourses,
                    'total_batches'        => $totalBatches,
                    'total_enrollments'    => $totalEnrollments,
                    'total_students'       => $totalStudents,
                ],
                'health' => [
                    'courses_without_program' => $coursesWithoutProgram,
                    'courses_without_subject' => $coursesWithoutSubject,
                    'taxonomy_complete'       => $coursesWithoutProgram === 0 && $coursesWithoutSubject === 0,
                ],
                'by_education_type'  => $coursesByType,
            ];
        });

        return $this->success($stats, 'Academic dashboard stats retrieved successfully.');
    }
}
