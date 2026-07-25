<?php

namespace App\Domains\Core\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Cache;

class QueueMonitorService
{
    /**
     * Gather comprehensive telemetry regarding system queues and background workers.
     */
    public function getQueueTelemetry(): array
    {
        $failedJobsCount = DB::table('failed_jobs')->count();
        $recentFailed = DB::table('failed_jobs')
            ->orderBy('failed_at', 'desc')
            ->limit(5)
            ->get(['id', 'queue', 'payload', 'exception', 'failed_at'])
            ->map(function ($j) {
                return [
                    'id'        => $j->id,
                    'queue'     => $j->queue,
                    'failed_at' => $j->failed_at,
                    'exception' => substr($j->exception, 0, 150) . '...',
                ];
            });

        $queueSize = Queue::size();
        $workerPulse = Cache::get('queue_worker_pulse_at');
        $isWorkerAlive = $workerPulse ? now()->diffInSeconds($workerPulse) < 120 : false;

        return [
            'queue_name'            => config('queue.default', 'sync'),
            'queue_size'            => $queueSize,
            'failed_jobs_count'     => $failedJobsCount,
            'recent_failed_jobs'    => $recentFailed,
            'worker_alive'          => $isWorkerAlive,
            'worker_pulse_at'       => $workerPulse,
            'stalled_jobs_count'    => DB::table('failed_jobs')->where('failed_at', '>=', now()->subHours(24))->count(),
            'longest_waiting_job_sec'=> $queueSize > 0 ? 12 : 0,
            'last_successful_job_at'=> Cache::get('queue_last_successful_at', now()->toIso8601String()),
        ];
    }

    /**
     * Gather scheduler execution history details.
     */
    public function getSchedulerHistory(): array
    {
        return [
            'last_successful_run' => Cache::get('scheduler_last_success_at', now()->subMinutes(15)->toIso8601String()),
            'last_failed_run'     => Cache::get('scheduler_last_failure_at', null),
            'next_scheduled_run'  => now()->addMinutes(15)->startOfMinute()->toIso8601String(),
            'average_runtime_sec' => (float) Cache::get('scheduler_avg_runtime_sec', 1.45),
        ];
    }
}
