<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\AssignmentSubmission;
use App\Domains\Core\Models\ActivityLog;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

class GradeSubmissionAction
{
    /**
     * Grade and review a student's assignment submission.
     */
    public function execute(AssignmentSubmission $submission, float $grade, string $feedback): AssignmentSubmission
    {
        $maxMarks = $submission->assignment->max_marks;
        if ($grade > $maxMarks) {
            throw new InvalidArgumentException("Grade ({$grade}) cannot exceed the assignment max marks ({$maxMarks}).");
        }

        $submission->update([
            'grade'       => $grade,
            'feedback'    => $feedback,
            'status'      => 'reviewed',
            'reviewed_at' => Carbon::now(),
        ]);

        ActivityLog::record(
            'assignment_graded',
            "Submission ID {$submission->id} has been reviewed and graded with {$grade} marks."
        );

        return $submission;
    }
}
