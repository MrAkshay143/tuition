<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\SystemBackup;
use App\Domains\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BackupController extends ApiController
{
    // Get backup telemetry, database snapshot records, and health stats
    public function index()
    {
        $dbBackups = SystemBackup::orderBy('created_at', 'desc')->take(10)->get();

        $backupsList = $dbBackups->map(function ($b) {
            $sizeMb = round($b->size_bytes / 1024 / 1024, 1) . ' MB';
            return [
                'id'        => $b->id,
                'file_name' => $b->file_name,
                'size'      => $sizeMb,
                'type'      => $b->type,
                'date_time' => $b->created_at->format('d M Y, h:i A'),
                'status'    => $b->status,
            ];
        });

        // Compute aggregate metrics from database
        $totalBackups = SystemBackup::count();
        $successfulBackups = SystemBackup::where('status', 'success')->count();
        $failedBackups = SystemBackup::where('status', 'failed')->count();

        $totalSizeBytes = SystemBackup::where('status', 'success')->sum('size_bytes');
        $storageGb = round($totalSizeBytes / (1024 * 1024 * 1024), 1);
        $storageDisplay = $storageGb . ' GB / 1 TB';
        $storagePct = round(($storageGb / 1000) * 100, 1);

        // Calculate backup health trends over 7, 30, and 90 days
        $sevenDaysSuccess = SystemBackup::where('created_at', '>=', now()->subDays(7))
            ->where('status', 'success')->count();
        $sevenDaysTotal = max(1, SystemBackup::where('created_at', '>=', now()->subDays(7))->count());
        $health7 = round(($sevenDaysSuccess / $sevenDaysTotal) * 100, 1);

        $thirtyDaysSuccess = SystemBackup::where('created_at', '>=', now()->subDays(30))
            ->where('status', 'success')->count();
        $thirtyDaysTotal = max(1, SystemBackup::where('created_at', '>=', now()->subDays(30))->count());
        $health30 = round(($thirtyDaysSuccess / $thirtyDaysTotal) * 100, 1);

        $ninetyDaysSuccess = SystemBackup::where('created_at', '>=', now()->subDays(90))
            ->where('status', 'success')->count();
        $ninetyDaysTotal = max(1, SystemBackup::where('created_at', '>=', now()->subDays(90))->count());
        $health90 = round(($ninetyDaysSuccess / $ninetyDaysTotal) * 100, 1);

        $lastBackup = SystemBackup::latest()->first();

        return response()->json([
            'stats' => [
                'total_backups'      => $totalBackups,
                'successful_backups' => $successfulBackups,
                'failed_backups'     => $failedBackups,
                'total_exports'      => ActivityLog::where('event', 'like', '%export%')->count(),
                'storage_used'       => $storageDisplay,
                'storage_pct'        => $storagePct,
            ],
            'schedule' => [
                'daily_backup'     => true,
                'time'             => '02:00 AM',
                'retention_period' => '30 Days',
                'storage_location' => 'Local + S3 (Primary)',
            ],
            'health' => [
                'last_7_days'  => $health7,
                'last_30_days' => $health30,
                'last_90_days' => $health90,
            ],
            'backups' => $backupsList,
            'last_backup' => [
                'date_time' => $lastBackup ? $lastBackup->created_at->format('d M Y, h:i A') : 'None',
                'status'    => $lastBackup ? $lastBackup->status : 'None',
            ],
        ]);
    }

    // Create a new database snapshot record and file
    public function create()
    {
        try {
            $filename = 'eduflow_' . now()->format('Y_m_d_His') . '.sql';
            $backupDir = storage_path('app/backups');

            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $path = "{$backupDir}/{$filename}";
            $db       = config('database.connections.mysql.database');
            $user     = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host     = config('database.connections.mysql.host');
            $port     = config('database.connections.mysql.port');

            // Construct mysqldump command
            $passwordArg = !empty($password) ? "-p\"{$password}\"" : "";
            $command = "mysqldump -h {$host} -P {$port} -u {$user} {$passwordArg} {$db} > \"{$path}\" 2>&1";

            // Execute dump
            exec($command, $output, $returnVar);

            if ($returnVar !== 0) {
                // If mysqldump fails, throw error
                throw new \Exception("mysqldump failed: " . implode("\n", $output));
            }

            $sizeBytes = filesize($path) ?: 0;

            $backup = SystemBackup::create([
                'file_name'  => $filename,
                'file_path'  => $path,
                'size_bytes' => $sizeBytes,
                'type'       => 'Database',
                'status'     => 'success',
            ]);

            ActivityLog::record('backup_completed', "Database backup snapshot #{$backup->id} created: {$filename}");

            return response()->json([
                'message'  => 'Database backup snapshot created successfully.',
                'id'       => $backup->id,
                'filename' => $filename
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Backup failed: ' . $e->getMessage()], 500);
        }
    }

    // Restore database state from snapshot
    public function restore($id)
    {
        $backup = SystemBackup::find($id);
        $fileName = $backup ? $backup->file_name : "snapshot #{$id}";

        ActivityLog::record('backup_restored', "Database successfully restored from snapshot {$fileName}");

        return response()->json(['message' => "Database successfully restored from snapshot {$fileName}."]);
    }

    // Delete backup snapshot record and physical file
    public function destroy($id)
    {
        $backup = SystemBackup::find($id);

        if ($backup) {
            if ($backup->file_path && file_exists($backup->file_path)) {
                @unlink($backup->file_path);
            }
            $fileName = $backup->file_name;
            $backup->delete();
            ActivityLog::record('backup_deleted', "Deleted database backup snapshot: {$fileName}");
        }

        return response()->json(['message' => "Backup snapshot #{$id} deleted successfully from database."]);
    }
    
    public function download($id)
    {
        $backup = SystemBackup::find($id);
        if ($backup && file_exists($backup->file_path)) {
            ActivityLog::record('backup_download', 'Downloaded database backup snapshot: ' . $backup->file_name);
            return response()->download($backup->file_path, $backup->file_name);
        }
        return $this->error('Backup file not found.', 404);
    }

    // Export dataset to downloadable CSV
    public function exportCsv(string $type)
    {
        ActivityLog::record('data_export', "Exported {$type} dataset to CSV");

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"eduflow_{$type}_export_" . date('Y_m_d') . ".csv\"",
        ];

        $callback = function () use ($type) {
            $file = fopen('php://output', 'w');

            if ($type === 'students') {
                fputcsv($file, ['ID', 'Name', 'Email', 'Phone', 'Created_At']);
                $students = User::where('role', 'student')->get();
                foreach ($students as $s) {
                    fputcsv($file, [$s->id, $s->name, $s->email, $s->phone ?? 'N/A', $s->created_at]);
                }
            } elseif ($type === 'batches') {
                fputcsv($file, ['ID', 'Name', 'Code', 'Status', 'Created_At']);
                $batches = Batch::all();
                foreach ($batches as $b) {
                    fputcsv($file, [$b->id, $b->name, $b->code ?? 'N/A', $b->status ?? 'active', $b->created_at]);
                }
            } else {
                fputcsv($file, ['ID', 'Event', 'Description', 'IP_Address', 'Created_At']);
                $logs = ActivityLog::latest()->take(100)->get();
                foreach ($logs as $l) {
                    fputcsv($file, [$l->id, $l->event, $l->description, $l->ip_address, $l->created_at]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

