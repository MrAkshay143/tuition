<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\ApiController;
use Illuminate\Http\Request;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseModule;
use App\Domains\Course\Models\Lesson;
use App\Domains\Core\Models\Batch;
use App\Domains\Assessment\Models\Assignment;
use App\Domains\Assessment\Models\Exam;
use App\Domains\Core\Models\User;

class GlobalSearchController extends ApiController
{
    /**
     * Unified search across courses, batches, lessons, teachers, students, assignments, and exams.
     */
    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));
        if (strlen($q) < 2) {
            return $this->success([
                'courses'      => [],
                'batches'      => [],
                'students'     => [],
                'teachers'     => [],
                'modules'      => [],
                'lessons'      => [],
                'assignments'  => [],
                'exams'        => [],
            ]);
        }

        $user = auth()->user();
        $isAdmin = $user && $user->role === 'admin';
        $isTeacher = $user && $user->role === 'teacher';
        $isStudent = $user && $user->role === 'student';

        // 1. Courses
        $courses = [];
        try {
            $coursesQuery = Course::query()->where('title', 'LIKE', "%{$q}%");
            if ($isTeacher) {
                $coursesQuery->where('teacher_id', $user->id);
            } elseif ($isStudent) {
                // Students can only see published courses that they are enrolled in
                $coursesQuery->where('status', 'published')
                             ->whereHas('batches.students', fn($sq) => $sq->where('users.id', $user->id));
            }
            $courses = $coursesQuery->limit(5)->get(['id', 'title', 'status']);
        } catch (\Throwable $e) {}

        // 2. Batches
        $batches = [];
        try {
            $batchesQuery = Batch::query()->where('name', 'LIKE', "%{$q}%");
            if ($isTeacher) {
                $batchesQuery->where('teacher_id', $user->id);
            } elseif ($isStudent) {
                $batchesQuery->where('is_active', true)
                             ->whereHas('students', fn($q2) => $q2->where('users.id', $user->id));
            }
            $batches = $batchesQuery->limit(5)->get(['id', 'name', 'color']);
        } catch (\Throwable $e) {}

        // 3. Students (Admin & Teacher only)
        $students = [];
        if ($isAdmin || $isTeacher) {
            try {
                $studentsQuery = User::query()->where('role', 'student')->where(function ($query) use ($q) {
                    $query->where('name', 'LIKE', "%{$q}%")->orWhere('email', 'LIKE', "%{$q}%");
                });
                $students = $studentsQuery->limit(5)->get(['id', 'name', 'email']);
            } catch (\Throwable $e) {}
        }

        // 4. Teachers (Admin-only search)
        $teachers = [];
        if ($isAdmin) {
            try {
                $teachers = User::query()
                    ->where('role', 'teacher')
                    ->where(function ($query) use ($q) {
                        $query->where('name', 'LIKE', "%{$q}%")->orWhere('email', 'LIKE', "%{$q}%");
                    })
                    ->limit(5)
                    ->get(['id', 'name', 'email']);
            } catch (\Throwable $e) {}
        }

        // 5. Course Modules
        $modules = [];
        try {
            $modulesQuery = CourseModule::query()->where('title', 'LIKE', "%{$q}%");
            if ($isTeacher) {
                $modulesQuery->whereHas('course', fn($c) => $c->where('teacher_id', $user->id));
            } elseif ($isStudent) {
                $modulesQuery->whereHas('course', fn($c) => 
                    $c->where('status', 'published')
                      ->whereHas('batches.students', fn($sq) => $sq->where('users.id', $user->id))
                );
            }
            $modules = $modulesQuery->limit(5)->get(['id', 'title', 'course_id']);
        } catch (\Throwable $e) {}

        // 6. Lessons
        $lessons = [];
        try {
            $lessonsQuery = Lesson::query()->where('title', 'LIKE', "%{$q}%");
            if ($isTeacher) {
                $lessonsQuery->whereHas('chapter.module.course', fn($c) => $c->where('teacher_id', $user->id));
            } elseif ($isStudent) {
                $lessonsQuery->whereHas('chapter.module.course', fn($c) => 
                    $c->where('status', 'published')
                      ->whereHas('batches.students', fn($sq) => $sq->where('users.id', $user->id))
                );
            }
            $lessons = $lessonsQuery->limit(5)->get(['id', 'title']);
        } catch (\Throwable $e) {}

        // 7. Assignments
        $assignments = [];
        try {
            $assignmentsQuery = Assignment::query()->where('title', 'LIKE', "%{$q}%");
            if ($isTeacher) {
                $assignmentsQuery->where('teacher_id', $user->id);
            } elseif ($isStudent) {
                $assignmentsQuery->whereHas('batches.students', fn($q) => $q->where('users.id', $user->id));
            }
            $assignments = $assignmentsQuery->limit(5)->get(['id', 'title', 'due_at']);
        } catch (\Throwable $e) {}

        // 8. Exams
        $exams = [];
        try {
            $examsQuery = Exam::query()->where('title', 'LIKE', "%{$q}%");
            if ($isTeacher) {
                $examsQuery->where('teacher_id', $user->id);
            } elseif ($isStudent) {
                $examsQuery->whereHas('batches.students', fn($q) => $q->where('users.id', $user->id));
            }
            $exams = $examsQuery->limit(5)->get(['id', 'title', 'duration_minutes']);
        } catch (\Throwable $e) {}

        return $this->success([
            'courses'      => $courses,
            'batches'      => $batches,
            'students'     => $students,
            'teachers'     => $teachers,
            'modules'      => $modules,
            'lessons'      => $lessons,
            'assignments'  => $assignments,
            'exams'        => $exams,
        ]);
    }
}

