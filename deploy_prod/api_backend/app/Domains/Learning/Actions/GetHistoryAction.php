<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Learning\Models\LearningHistory;
use Illuminate\Support\Collection;

class GetHistoryAction
{
    public function execute(User $user): Collection
    {
        return LearningHistory::where('user_id', $user->id)
            ->with(['lesson', 'course'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($h) {
                return [
                    'id'            => $h->id,
                    'action'        => $h->action,
                    'watch_seconds' => $h->watch_seconds,
                    'created_at'    => $h->created_at,
                    'lesson_title'  => $h->lesson?->title,
                    'course_title'  => $h->course?->title,
                ];
            });
    }
}
