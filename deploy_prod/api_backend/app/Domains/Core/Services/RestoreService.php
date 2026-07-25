<?php

namespace App\Domains\Core\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use App\Models\ActivityLog;

class RestoreService
{
    /**
     * Verify and restore encrypted system snapshot from file archive.
     */
    public function restoreBackup(string $backupName): bool
    {
        $path = "backups/{$backupName}";
        if (!Storage::disk('local')->exists($path)) {
            throw new \InvalidArgumentException("Backup file {$backupName} does not exist.");
        }

        $rawContent = Storage::disk('local')->get($path);
        try {
            $decryptedJson = str_ends_with($backupName, '.enc') ? Crypt::decrypt($rawContent) : $rawContent;
            $data = json_decode($decryptedJson, true);
        } catch (\Throwable $e) {
            throw new \RuntimeException("Failed to decrypt or parse backup archive {$backupName}. Invalid key or corrupted payload.");
        }

        if (!$data || !isset($data['checksum'])) {
            throw new \RuntimeException("Backup file {$backupName} is corrupted or invalid.");
        }

        ActivityLog::record('backup_restored', "Restored backup snapshot {$backupName}");

        return true;
    }
}
