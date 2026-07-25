<?php

namespace App\Domains\Core\Services;

use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\Batch;
use App\Domains\Media\Models\Media;
use App\Domains\Core\Models\User;

class SearchService
{
    /**
     * Perform global search across all core entities.
     */
    public function search(string $query, ?User $user = null): array
    {
        $user = $user ?? auth()->user();

        $courses = Course::visibleTo($user)
            ->where('title', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'title', 'thumbnail', 'status']);

        $batches = Batch::visibleTo($user)
            ->where('name', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'color']);

        $media = Media::visibleTo($user)
            ->where('name', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'mime', 'path']);

        $students = [];
        if ($user && ($user->isAdmin() || $user->isTeacher())) {
            $studentQuery = User::students()->where('name', 'like', "%{$query}%");
            if ($user->isTeacher()) {
                $studentQuery->whereHas('batches', fn($b) => $b->where('teacher_id', $user->id));
            }
            $students = $studentQuery->limit(5)->get(['id', 'name', 'email', 'avatar']);
        }

        return [
            'courses'  => $courses,
            'batches'  => $batches,
            'media'    => $media,
            'students' => $students,
        ];
    }
}
