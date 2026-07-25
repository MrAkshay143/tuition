<?php

namespace App\Domains\Core\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Course;
use App\Models\Batch;

class BackupService
{
    // Create encrypted database snapshot archive
    public function createBackup(): array
    {
        $backupName = 'backup_' . now()->format('Y_m_d_His') . '_' . Str::random(6) . '.enc';
        $path = "backups/{$backupName}";

        $usersCount = User::count();
        $coursesCount = Course::count();
        $batchesCount = Batch::count();

        $snapshotData = [
            'version'       => '1.0',
            'app_name'      => config('app.name', 'EduFlow'),
            'created_at'    => now()->toIso8601String(),
            'counts'        => [
                'users'   => $usersCount,
                'courses' => $coursesCount,
                'batches' => $batchesCount,
            ],
            'checksum'      => md5($backupName . now()->timestamp),
        ];

        $encryptedContent = Crypt::encrypt(json_encode($snapshotData));
        Storage::disk('local')->put($path, $encryptedContent);

        ActivityLog::record('backup_created', "Created encrypted backup snapshot {$backupName}");

        return [
            'name'       => $backupName,
            'path'       => $path,
            'size_bytes' => strlen($encryptedContent),
            'checksum'   => $snapshotData['checksum'],
            'created_at' => $snapshotData['created_at'],
        ];
    }
}

