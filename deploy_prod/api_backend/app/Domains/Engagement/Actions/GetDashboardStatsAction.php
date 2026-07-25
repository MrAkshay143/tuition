<?php
namespace App\Domains\Engagement\Actions;

use App\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\Batch;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class GetDashboardStatsAction
{
    public function execute(): array
    {
        // 1. Core counters
        $totalStudents = User::students()->count();
        $activeStudents = User::students()->where('active', true)->count();
        $teachersCount = User::where('role', 'teacher')->count();
        $totalCourses = Course::count();
        $publishedCourses = Course::where('status', 'published')->count();
        $draftCourses = Course::where('status', 'draft')->count();
        $batchesCount = Batch::count();

        // 2. Recent items
        $recentStudents = User::students()->orderBy('created_at', 'desc')->limit(5)->get(['id', 'name', 'email', 'created_at']);
        $recentCourses = Course::orderBy('created_at', 'desc')->limit(5)->get(['id', 'title', 'status', 'created_at']);
        $recentActivity = ActivityLog::orderBy('created_at', 'desc')->limit(5)->get(['id', 'action', 'description', 'created_at']);

        // 3. Pending items
        $pendingGrading = DB::table('assignment_submissions')->whereNull('grade')->count();
        $upcomingLive = DB::table('live_classes')->where('scheduled_at', '>=', now())->count();

        // System stats
        $activeSessions = DB::table('user_sessions')->where('status', 'ACTIVE')->count();
        $queueDepth = DB::table('jobs')->count();
        $diskFreeGb = round(disk_free_space('/') / 1024 / 1024 / 1024, 2);

        return [
            'counters' => [
                'total_students'     => $totalStudents,
                'active_students'    => $activeStudents,
                'teachers_count'     => $teachersCount,
                'total_courses'      => $totalCourses,
                'published_courses'  => $publishedCourses,
                'draft_courses'      => $draftCourses,
                'batches_count'      => $batchesCount,
            ],
            'recent' => [
                'students' => $recentStudents,
                'courses'  => $recentCourses,
                'activity' => $recentActivity,
            ],
            'pending' => [
                'grading_count'  => $pendingGrading,
                'upcoming_live'  => $upcomingLive,
                'draft_courses'  => $draftCourses,
            ],
            'system' => [
                'active_sessions' => $activeSessions,
                'queue_depth'     => $queueDepth,
                'disk_free_gb'    => $diskFreeGb,
            ],
        ];
    }
}
