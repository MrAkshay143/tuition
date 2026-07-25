<?php

namespace Database\Seeders;

use App\Models\SystemBackup;
use App\Models\ActivityLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class BackupSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure storage directory exists
        $backupDir = storage_path('app/backups');
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        // 2. Clear existing records
        SystemBackup::truncate();

        // 3. Seed 24 realistic database snapshot records spanning past 24 days
        $now = Carbon::now();

        for ($i = 0; $i < 24; $i++) {
            $date = $now->copy()->subDays($i)->setHour(3)->setMinute(55)->setSecond(0);
            $fileName = 'eduflow_ai_' . $date->format('Y_m_d_His') . '.sql';
            $filePath = "{$backupDir}/{$fileName}";
            
            // 2 snapshots set as failed (matching 24 total, 22 success, 2 failed in reference UI)
            $isFailed = ($i === 2 || $i === 11);
            $status = $isFailed ? 'failed' : 'success';
            $size = rand(508000000, 515000000); // ~510 MB

            SystemBackup::create([
                'file_name'  => $fileName,
                'file_path'  => $filePath,
                'size_bytes' => $size,
                'type'       => 'Database',
                'status'     => $status,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            // Create physical file snapshot on disk
            if (!$isFailed) {
                file_put_contents($filePath, "-- EduFlow Database Snapshot Dump\n-- Created: {$date}\n-- Tables: users, courses, batches, activity_logs, system_backups\n");
            }
        }

        ActivityLog::record('backup_seeder', 'Seeded 24 system backup snapshots into MySQL database');
    }
}
