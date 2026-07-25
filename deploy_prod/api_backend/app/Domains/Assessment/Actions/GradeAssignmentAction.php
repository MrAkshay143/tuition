<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\AssignmentSubmission;

class GradeAssignmentAction {
    public function execute(AssignmentSubmission $submission, array $data) {
        $submission->update([
            "grade"       => $data["grade"],
            "feedback"    => $data["feedback"],
            "status"      => "reviewed",
            "reviewed_at" => now(),
        ]);
        return $submission;
    }
}
