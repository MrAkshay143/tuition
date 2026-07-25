<?php

namespace App\Domains\Analytics\Jobs;

use App\Domains\Settings\Models\Setting;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\LessonProgress;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateDailyAnalyticsSnapshotJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the daily historical metrics compilation.
     */
    public function handle(): void
    {
        Log::info("Starting GenerateDailyAnalyticsSnapshotJob...");

        $today = now()->toDateString();
        
        $activeStudentsCount = User::students()->active()->count();
        $lessonsCompletedToday = LessonProgress::whereDate('completed_at', today())->count();
        $watchTimeSeconds = LessonProgress::whereDate('updated_at', today())->sum('watched_seconds');

        $metrics = [
            'active_students'   => $activeStudentsCount,
            'lessons_completed' => $lessonsCompletedToday,
            'watch_time_hours'  => round($watchTimeSeconds / 3600, 1),
            'generated_at'      => now()->toDateTimeString(),
        ];

        // Store this compiled data inside Settings/Analytics persistence card
        Setting::set("analytics_snapshot_{$today}", json_encode($metrics));

        Log::info("GenerateDailyAnalyticsSnapshotJob completed: " . json_encode($metrics));
    }
}
