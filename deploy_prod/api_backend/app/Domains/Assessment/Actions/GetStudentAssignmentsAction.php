<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Assignment;
use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\DB;

class GetStudentAssignmentsAction
{
    public function execute(?User $user = null)
    {
        if (!$user || $user->isAdmin()) {
            return Assignment::with(['attachedMedia', 'batches'])->orderBy('due_at', 'asc')->paginate(20);
        }

        $batchIds = DB::table("batch_student")->where("student_id", $user->id)->pluck("batch_id");
        return Assignment::whereHas("batches", fn($q) => $q->whereIn("batches.id", $batchIds))
            ->with([
                "attachedMedia",
                "submissions" => fn($q) => $q->where("student_id", $user->id)->with('attachedMedia')
            ])
            ->orderBy("due_at", "asc")
            ->paginate(20);
    }
}
