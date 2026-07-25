<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\LiveClass\Models\LiveClassAttendance;
use App\Domains\Core\Models\User;
class RecordAttendanceAction {
    public function execute(LiveClass $liveClass, User $student, array $data): LiveClassAttendance {
        return LiveClassAttendance::updateOrCreate(
            ["live_class_id" => $liveClass->id, "student_id" => $student->id],
            [
                "joined_at" => now(),
                "duration_minutes" => \Illuminate\Support\Facades\DB::raw("duration_minutes + " . $data["duration_minutes"]),
                "device_info" => $data["device_info"] ?? null,
            ]
        );
    }
}
