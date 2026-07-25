<?php

namespace App\Domains\Engagement\Actions;

use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetLiveClassesAction
{
    public function execute(?User $user = null, array $filters = []): LengthAwarePaginator
    {
        $query = LiveClass::query()->with(["batches", "teacher:id,name,avatar"]);

        if ($user && $user->isTeacher()) {
            $query->where(function ($q) use ($user) {
                $q->where("teacher_id", $user->id)->orWhereNull("teacher_id");
            });
        }

        if ($user && $user->isStudent()) {
            $batchIds = \Illuminate\Support\Facades\DB::table("batch_student")
                ->where("student_id", $user->id)
                ->pluck("batch_id")
                ->toArray();
            $query->whereHas("batches", fn($q) => $q->whereIn("batches.id", $batchIds));
        }

        if (isset($filters["batch_id"]) && !empty($filters["batch_id"])) {
            $query->whereHas("batches", fn($q) => $q->where("batches.id", $filters["batch_id"]));
        }

        if (isset($filters["status"]) && !empty($filters["status"]) && $filters["status"] !== 'all') {
            $query->where("status", $filters["status"]);
        }

        return $query->latest("scheduled_at")->paginate(20);
    }
}
