<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Exam;
use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\DB;

class GetStudentExamsAction
{
    public function execute(?User $user = null)
    {
        if (!$user || $user->isAdmin()) {
            return Exam::latest()->paginate(20);
        }
        $batchIds = DB::table("batch_student")->where("student_id", $user->id)->pluck("batch_id");
        return Exam::whereHas("batches", fn($q) => $q->whereIn("batches.id", $batchIds))
            ->with(["attempts" => fn($q) => $q->where("student_id", $user->id)])
            ->latest()
            ->paginate(20);
    }
}
