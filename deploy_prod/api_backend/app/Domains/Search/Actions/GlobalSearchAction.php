<?php

namespace App\Domains\Search\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\Lesson;
use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\Core\Models\User;

class GlobalSearchAction
{
    /**
     * Execute a global multi-domain search.
     */
    public function execute(string $term): array
    {
        $term = trim($term);
        if (strlen($term) < 2) {
            return [
                'courses'      => [],
                'lessons'      => [],
                'live_classes' => [],
                'students'     => [],
            ];
        }

        $query = "%{$term}%";

        $courses = Course::where('title', 'like', $query)
            ->orWhere('description', 'like', $query)
            ->limit(5)
            ->get(['id', 'title', 'thumbnail']);

        $lessons = Lesson::where('title', 'like', $query)
            ->orWhere('content', 'like', $query)
            ->limit(5)
            ->get(['id', 'title', 'type', 'module_id']);

        $liveClasses = LiveClass::where('title', 'like', $query)
            ->orWhere('description', 'like', $query)
            ->limit(5)
            ->get(['id', 'title', 'scheduled_at', 'meeting_url']);

        $students = User::students()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', $query)
                  ->orWhere('email', 'like', $query);
            })
            ->limit(5)
            ->get(['id', 'name', 'email', 'avatar']);

        return [
            'courses'      => $courses,
            'lessons'      => $lessons,
            'live_classes' => $liveClasses,
            'students'     => $students,
        ];
    }
}
