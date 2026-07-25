<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Learning\Models\LearningSession;
use App\Domains\Learning\Models\CourseCompletion;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\Lesson;

class ResumeLearningAction
{
    public function execute(User $user): ?array
    {
        // 1. Get completed courses to ignore them
        $completedCourseIds = CourseCompletion::where('user_id', $user->id)
            ->where('completed_percentage', 100)
            ->pluck('course_id')
            ->toArray();

        // 2. Query learning sessions ordered by updated_at desc
        $session = LearningSession::where('user_id', $user->id)
            ->whereHas('lesson.module.course', function ($q) use ($completedCourseIds) {
                $q->where('status', 'published')
                    ->whereNotIn('id', $completedCourseIds);
            })
            ->with(['lesson.module.course'])
            ->orderBy('updated_at', 'desc')
            ->first();

        // If no session history exists, fallback to first enrolled course's first lesson
        if (!$session) {
            $enrollment = \App\Domains\Learning\Models\Enrollment::where('user_id', $user->id)
                ->where('status', 'active')
                ->whereHas('course', function ($q) use ($completedCourseIds) {
                    $q->where('status', 'published')
                        ->whereNotIn('id', $completedCourseIds);
                })
                ->first();

            if ($enrollment) {
                $lesson = Lesson::whereHas('module', function ($q) use ($enrollment) {
                    $q->where('course_id', $enrollment->course_id);
                })
                ->with(['module.course'])
                ->orderBy('sort_order', 'asc')
                ->first();

                if ($lesson) {
                    return [
                        'course'          => $lesson->module->course,
                        'module'          => $lesson->module,
                        'lesson'          => $lesson,
                        'resume_position' => 0,
                        'watch_percentage'=> 0,
                        'resume_url'      => "/courses/" . $lesson->module->course_id,
                    ];
                }
            }
            return null;
        }

        $lesson = $session->lesson;
        $course = $lesson->module->course;
        
        $watchSeconds = $session->watch_seconds;
        $duration = $lesson->duration_seconds ?: 1;
        $pct = min(100, (int) round(($watchSeconds / $duration) * 100));

        return [
            'course'          => $course,
            'module'          => $lesson->module,
            'lesson'          => $lesson,
            'resume_position' => $session->last_position,
            'watch_percentage'=> $pct,
            'resume_url'      => "/courses/" . $course->id,
        ];
    }
}
