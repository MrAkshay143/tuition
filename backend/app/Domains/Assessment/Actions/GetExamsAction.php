<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Exam;
use App\Domains\Core\Models\User;

class GetExamsAction
{
    public function execute(?User $user = null, array $filters = [])
    {
        $query = Exam::query()->with(["batches"])->withCount("attempts");
        if ($user && $user->isTeacher()) {
            $query->where("teacher_id", $user->id);
        }
        if (isset($filters["batch_id"])) {
            $query->whereHas("batches", fn($q) => $q->where("batches.id", $filters["batch_id"]));
        }
        return $query->latest()->paginate(20);
    }
}
