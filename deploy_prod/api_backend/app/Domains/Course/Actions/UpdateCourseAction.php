<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Course;
use App\Domains\Course\DTOs\UpdateCourseDTO;
use App\Domains\Core\Models\ActivityLog;

class UpdateCourseAction
{
    /**
     * Update an existing course, then sync batch assignments if provided.
     */
    public function execute(Course $course, UpdateCourseDTO $dto): Course
    {
        // Optimistic concurrency check
        if ($dto->lastUpdatedAt) {
            $clientTime = \Carbon\Carbon::parse($dto->lastUpdatedAt)->timestamp;
            $dbTime = $course->updated_at->timestamp;
            if ($dbTime > $clientTime) {
                abort(409, 'Conflict: The course has been modified by another user or session. Please refresh your editor.');
            }
        }

        $course->update($dto->toArray());

        // Sync batch_ids if provided (null = don't touch; [] = detach all)
        if (!is_null($dto->batchIds)) {
            $course->batches()->sync($dto->batchIds);
        }

        \App\Domains\Course\Models\CourseActivityLog::create([
            'course_id'   => $course->id,
            'user_id'     => auth()->id() ?? $course->teacher_id,
            'event'       => 'updated',
            'description' => "Course metadata was updated by " . (auth()->user()->name ?? 'System'),
            'properties'  => $dto->toArray(),
        ]);

        ActivityLog::record(
            'course_updated',
            "Course '{$course->title}' has been updated."
        );

        return $course->load('program', 'subject', 'batches');
    }
}
