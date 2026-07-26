<?php

namespace App\Domains\Core\Services;

use App\Domains\Core\Models\User;
use App\Models\Batch;
use App\Models\Course;
use App\Models\LiveClass;
use App\Models\AssignmentSubmission;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;

class DashboardService
{
    /**
     * Get Teacher Dashboard Stats
     */
    public function getTeacherDashboard(User $user)
    {
        $isTeacher = $user->role === 'teacher';

        $studentQuery = User::students();
        if ($isTeacher) {
            $studentQuery->whereHas('batches', fn($q) => $q->where('teacher_id', $user->id));
        }

        $stats = [
            'total_students'     => $studentQuery->count(),
            'active_students'    => $studentQuery->active()->count(),
            'total_batches'      => Batch::visibleTo($user)->count(),
            'total_courses'      => Course::visibleTo($user)->count(),
            'pending_assignments'=> AssignmentSubmission::where('status', 'submitted')
                ->when($isTeacher, fn($q) => $q->whereHas('assignment', fn($a) => $a->where('teacher_id', $user->id)))
                ->count(),
            'todays_classes'     => LiveClass::visibleTo($user)->whereDate('scheduled_at', today())->count(),
        ];

        $todaysClasses = LiveClass::visibleTo($user)->whereDate('scheduled_at', today())
            ->with('batches:id,name')
            ->orderBy('scheduled_at')
            ->get(['id','title','scheduled_at','duration_minutes','status','provider','meeting_url']);

        $upcomingClasses = LiveClass::visibleTo($user)->where('scheduled_at', '>', now())
            ->where('status', 'scheduled')
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get(['id','title','scheduled_at','duration_minutes','status','provider','meeting_url']);

        $recentSubmissions = AssignmentSubmission::where('status', 'submitted')
            ->when($isTeacher, fn($q) => $q->whereHas('assignment', fn($a) => $a->where('teacher_id', $user->id)))
            ->with('student:id,name,avatar')
            ->latest('submitted_at')
            ->limit(10)
            ->get(['id','student_id','submitted_at','assignment_id','status']);

        // Use LearningAnalyticsService / LessonProgress model instead of DB facade where possible
        // But for grouped weekly activity, DB is acceptable within a Service, just not Controller
        $rawActivity = DB::table('lesson_progress as lp')
            ->join('users as u', 'u.id', '=', 'lp.user_id')
            ->where('u.role', 'student')
            ->when($isTeacher, fn($q) => $q->whereExists(fn($sub) =>
                $sub->select(DB::raw(1))
                    ->from('batch_user as bu')
                    ->join('batches as b', 'b.id', '=', 'bu.batch_id')
                    ->whereColumn('bu.user_id', 'u.id')
                    ->where('b.teacher_id', $user->id)
            ))
            ->where('lp.created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy(DB::raw('DATE(lp.created_at)'))
            ->orderBy('date')
            ->selectRaw('DATE(lp.created_at) as date, COUNT(DISTINCT lp.user_id) as students_active, COUNT(lp.id) as lessons_completed')
            ->get()
            ->keyBy('date');

        $weeklyActivity = collect();
        for ($i = 6; $i >= 0; $i--) {
            $dateStr = now()->subDays($i)->format('Y-m-d');
            $found = $rawActivity->get($dateStr);
            $weeklyActivity->push([
                'date' => $dateStr,
                'students_active' => $found ? (int)$found->students_active : 0,
                'lessons_completed' => $found ? (int)$found->lessons_completed : 0,
            ]);
        }

        $topStudents = DB::table('lesson_progress as lp')
            ->join('users as u', 'u.id', '=', 'lp.user_id')
            ->where('u.role', 'student')
            ->where('lp.created_at', '>=', now()->subDays(7))
            ->groupBy('lp.user_id', 'u.name', 'u.avatar')
            ->selectRaw('lp.user_id, u.name, u.avatar, COUNT(lp.id) as lessons_completed')
            ->orderByDesc('lessons_completed')
            ->limit(5)
            ->get();

        $avgScore = 0;
        try {
            $avgScore = AssignmentSubmission::where('status', 'graded')
                ->when($isTeacher, fn($q) => $q->whereHas('assignment', fn($a) => $a->where('teacher_id', $user->id)))
                ->avg('grade') ?? 0;
        } catch (\Throwable $e) {}

        $stats['avg_assignment_score'] = round((float)$avgScore, 1);
        $stats['top_students'] = $topStudents;

        $storageUsed = 0;
        try {
            $storageUsed = \App\Domains\Media\Models\Media::sum('size_bytes');
        } catch (\Throwable $e) {}
        $storageTotal = max(15 * 1024 * 1024 * 1024, (int)ceil(($storageUsed * 1.3) / (1024 * 1024 * 1024)) * 1024 * 1024 * 1024);

        return [
            'stats'               => $stats,
            'todays_classes'      => $todaysClasses,
            'upcoming_classes'    => $upcomingClasses,
            'recent_submissions'  => $recentSubmissions,
            'weekly_activity'     => $weeklyActivity,
            'storage'             => [
                'used_bytes'  => $storageUsed,
                'total_bytes' => $storageTotal,
                'percentage'  => min(100, round(($storageUsed / max($storageTotal, 1)) * 100, 1)),
            ],
        ];
    }

    /**
     * Admin Overview Dashboard
     */
    public function getAdminOverview()
    {
        $teacher = User::teachers()->first();

        $storageUsed = Cache::remember('admin_storage_used', 300, function () {
            return (int) \App\Domains\Media\Models\Media::sum('size_bytes');
        });

        $stats = [
            'total_users'        => User::count(),
            'active_students'    => User::students()->active()->count(),
            'total_courses'      => Course::count(),
            'storage_used_bytes' => $storageUsed,
            'teacher'            => $teacher ? [
                'id'                  => $teacher->id,
                'name'                => $teacher->name,
                'email'               => $teacher->email,
                'avatar'              => $teacher->avatar_url,
                'active'              => $teacher->active,
                'two_factor_enabled'  => $teacher->two_factor_enabled,
                'google_id'           => (bool) $teacher->google_id,
            ] : null,
        ];

        $queueDepth = 0;
        try {
            $queueDepth = Queue::size('default') + Queue::size('videos');
        } catch (\Throwable $e) {}

        $systemHealth = [
            'php_version'    => PHP_VERSION,
            'laravel_version'=> app()->version(),
            'redis_connected'=> $this->checkRedis(),
            'queue_workers'  => $queueDepth > 0 ? 1 : 0,
            'queue_depth'    => $queueDepth,
            'db_size_bytes'  => Cache::remember('admin_db_size', 300, fn() => $this->getDbSize()),
        ];

        $recentLogs = ActivityLog::with('user:id,name,avatar,role')
            ->latest()
            ->limit(15)
            ->get();

        return [
            'stats'         => $stats,
            'system_health' => $systemHealth,
            'recent_logs'   => $recentLogs,
        ];
    }

    private function checkRedis(): bool
    {
        if (!class_exists('Predis\Client') && !extension_loaded('redis')) {
            return false;
        }
        try {
            \Illuminate\Support\Facades\Redis::ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function getDbSize(): int
    {
        try {
            $connection = config('database.default');
            if ($connection === 'sqlite') {
                $path = config('database.connections.sqlite.database');
                return file_exists($path) ? filesize($path) : 0;
            }
            $result = DB::select(
                "SELECT SUM(data_length + index_length) AS size FROM information_schema.tables WHERE table_schema = DATABASE()"
            );
            return (int) ($result[0]->size ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get Student Dashboard Stats
     */
    public function getStudentDashboard(User $student)
    {
        $batches   = $student->batches()->with('courses:id,title,thumbnail')->get(['batches.id','name','color']);
        $courseIds = $batches->flatMap(fn($b) => $b->courses->pluck('id'))->unique();

        $pastClasses = LiveClass::whereHas('batches', fn($q) => $q->whereIn('batches.id', $batches->pluck('id')))
            ->where('scheduled_at', '<=', now())
            ->where('status', 'scheduled')
            ->get(['id']);
        $pastClassesCount = $pastClasses->count();

        if ($pastClassesCount > 0) {
            $attendedCount = \App\Domains\LiveClass\Models\LiveClassAttendance::where('user_id', $student->id)
                ->whereIn('live_class_id', $pastClasses->pluck('id'))
                ->count();
            $attendancePercentage = round(($attendedCount / $pastClassesCount) * 100, 1);
        } else {
            $attendancePercentage = 100.0;
        }

        $progress = [
            'courses_enrolled'       => $courseIds->count(),
            'attendance_percentage'  => $attendancePercentage,
            'assignments_pending'    => AssignmentSubmission::where('student_id', $student->id)->where('status', 'pending')->count(),
            'average_score'          => round(AssignmentSubmission::where('student_id', $student->id)->whereNotNull('grade')->avg('grade') ?? 0, 1),
        ];

        $upcomingClasses = LiveClass::whereHas('batches', fn($q) => $q->whereIn('batches.id', $batches->pluck('id')))
            ->where('scheduled_at', '>', now())
            ->where('status', 'scheduled')
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get();

        return [
            'progress'        => $progress,
            'batches'         => $batches,
            'upcoming_classes'=> $upcomingClasses,
        ];
    }

    /**
     * Get Student Profile
     */
    public function getStudentProfile(User $student)
    {
        $batches     = $student->batches()->with('courses:id,title,thumbnail')->get(['batches.id','name','color','is_active']);
        $submissions = $student->assignmentSubmissions()->with('assignment:id,title')->latest()->limit(20)->get();
        $exams       = $student->examAttempts()->with('exam:id,title')->latest()->limit(10)->get();
        $certs       = $student->certificates()->with('course:id,title')->latest()->get();
        $activity    = ActivityLog::where('user_id', $student->id)->latest()->limit(30)->get();

        $courseIds = $batches->flatMap(fn($b) => $b->courses->pluck('id'))->unique();

        $pastClasses = LiveClass::whereHas('batches', fn($q) => $q->whereIn('batches.id', $batches->pluck('id')))
            ->where('scheduled_at', '<=', now())
            ->where('status', 'scheduled')
            ->get(['id']);
        $pastClassesCount = $pastClasses->count();

        if ($pastClassesCount > 0) {
            $attendedCount = \App\Domains\LiveClass\Models\LiveClassAttendance::where('user_id', $student->id)
                ->whereIn('live_class_id', $pastClasses->pluck('id'))
                ->count();
            $attendancePercentage = round(($attendedCount / $pastClassesCount) * 100, 1);
        } else {
            $attendancePercentage = 100.0;
        }

        $completedCoursesCount = \App\Domains\Learning\Models\CourseCompletion::where('user_id', $student->id)
            ->where('completed_percentage', 100)
            ->whereIn('course_id', $courseIds)
            ->count();

        $totalWatchHours = round(\App\Domains\Learning\Models\LessonProgress::where('user_id', $student->id)->sum('watched_seconds') / 3600, 1);

        $progress = [
            'attendance_percentage'  => $attendancePercentage,
            'courses_enrolled'       => $courseIds->count(),
            'courses_completed'      => $completedCoursesCount,
            'assignments_submitted'  => $submissions->where('status', 'submitted')->count() + $submissions->where('status', 'reviewed')->count(),
            'assignments_pending'    => $submissions->where('status', 'pending')->count(),
            'average_score'          => round($submissions->whereNotNull('grade')->avg('grade') ?? 0, 1),
            'total_watch_hours'      => $totalWatchHours,
        ];

        return [
            'student'     => new \App\Http\Resources\V1\UserResource($student),
            'progress'    => $progress,
            'batches'     => $batches,
            'assignments' => $submissions,
            'exams'       => $exams,
            'certificates'=> $certs,
            'activity'    => $activity,
        ];
    }
}

