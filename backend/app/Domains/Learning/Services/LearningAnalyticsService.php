<?php

namespace App\Domains\Learning\Services;

use App\Domains\Learning\Models\LearningStreak;
use App\Domains\Learning\Models\LessonProgress;
use App\Domains\Learning\Models\CourseCompletion;
use App\Domains\Learning\Models\LearningHistory;
use App\Domains\Core\Models\User;
use Carbon\Carbon;

class LearningAnalyticsService
{
    public function updateStreak(User $user): LearningStreak
    {
        $streak = LearningStreak::firstOrCreate(
            ['user_id' => $user->id],
            [
                'current_streak_days' => 0,
                'longest_streak_days' => 0,
                'last_activity_date'  => null,
            ]
        );

        $today = Carbon::today();
        $lastActivity = $streak->last_activity_date ? Carbon::parse($streak->last_activity_date) : null;

        if (!$lastActivity) {
            $streak->current_streak_days = 1;
            $streak->longest_streak_days = 1;
        } else {
            $diff = $today->diffInDays($lastActivity);
            if ($diff === 1) {
                $streak->current_streak_days += 1;
                if ($streak->current_streak_days > $streak->longest_streak_days) {
                    $streak->longest_streak_days = $streak->current_streak_days;
                }
            } elseif ($diff > 1) {
                $streak->current_streak_days = 1;
            }
        }

        $streak->last_activity_date = $today;
        $streak->save();

        return $streak;
    }

    public function getAnalytics(User $user): array
    {
        $progressSeconds = (int) LessonProgress::where('user_id', $user->id)->sum('watched_seconds');
        $totalHours = round($progressSeconds / 3600, 1);

        $lessonsCompleted = LessonProgress::where('user_id', $user->id)
            ->where('completed', true)
            ->count();

        $coursesCompleted = CourseCompletion::where('user_id', $user->id)
            ->where('completed_percentage', 100)
            ->count();

        $streak = LearningStreak::where('user_id', $user->id)->first();

        // Weekly watch time (last 7 days by day)
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            // Fall back to sum of watch time updates in learning history or estimated progress
            $seconds = (int) LearningHistory::where('user_id', $user->id)
                ->whereDate('created_at', $date)
                ->sum('watch_seconds');
            // If empty, mock a minor spread or keep 0
            $weeklyActivity[] = [
                'day'   => $date->format('D'),
                'hours' => round($seconds / 3600, 2),
            ];
        }

        return [
            'hours_learned'     => $totalHours,
            'lessons_completed' => $lessonsCompleted,
            'courses_completed' => $coursesCompleted,
            'current_streak'    => $streak ? $streak->current_streak_days : 0,
            'longest_streak'    => $streak ? $streak->longest_streak_days : 0,
            'weekly_activity'   => $weeklyActivity,
        ];
    }
}
