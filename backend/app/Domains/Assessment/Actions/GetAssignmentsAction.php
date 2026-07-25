<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Assignment;
use App\Domains\Core\Models\User;

class GetAssignmentsAction {
    public function execute(?User $user = null, array $filters = []) {
        $query = Assignment::query()->with(["batches", "attachedMedia"])->withCount("submissions");
        if ($user && $user->isTeacher()) {
            $query->where("teacher_id", $user->id);
        }
        if (isset($filters["batch_id"])) {
            $query->whereHas("batches", fn($q) => $q->where("batches.id", $filters["batch_id"]));
        }
        return $query->latest()->paginate(20);
    }
}
