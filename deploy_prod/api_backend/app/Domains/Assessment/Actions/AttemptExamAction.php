<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Exam;
use App\Domains\Assessment\Models\ExamAttempt;
use Illuminate\Support\Carbon;

class AttemptExamAction
{
    /**
     * Start a new exam attempt for a student.
     */
    public function execute(Exam $exam, int $studentId): ExamAttempt
    {
        // Check if there is an active incomplete attempt
        $existing = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $studentId)
            ->whereNull('submitted_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        return ExamAttempt::create([
            'exam_id'      => $exam->id,
            'student_id'   => $studentId,
            'started_at'   => Carbon::now(),
            'answers'      => [],
            'score'        => 0.0,
            'percentage'   => 0.0,
            'passed'       => false,
        ]);
    }
}
