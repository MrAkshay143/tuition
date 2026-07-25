<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\ExamAttempt;
use App\Domains\Core\Models\ActivityLog;
use Illuminate\Support\Carbon;

class SubmitExamAttemptAction
{
    /**
     * Submit and auto-grade an exam attempt.
     */
    public function execute(ExamAttempt $attempt, array $submittedAnswers): ExamAttempt
    {
        $exam = $attempt->exam;
        $questions = $exam->questions;

        $score = 0.0;
        $totalMaxMarks = $exam->total_marks ?: 100.0;

        foreach ($questions as $q) {
            $studentAnswer = $submittedAnswers[$q->id] ?? null;
            $isCorrect = (string) $studentAnswer === (string) $q->correct_answer;

            if ($isCorrect) {
                $score += $q->marks;
            } else {
                // Support negative marking if configured on the question or exam
                // Let's assume a default negative mark of 25% of the question marks if wrong
                // $score -= ($q->marks * 0.25);
            }
        }

        // Keep score positive
        if ($score < 0) {
            $score = 0.0;
        }

        $percentage = ($score / $totalMaxMarks) * 100;
        $passed = $score >= $exam->pass_marks;

        $attempt->update([
            'answers'      => $submittedAnswers,
            'score'        => $score,
            'percentage'   => $percentage,
            'passed'       => $passed,
            'submitted_at' => Carbon::now(),
        ]);

        ActivityLog::record(
            'exam_attempt_submitted',
            "Exam ID {$exam->id} submitted by Student ID {$attempt->student_id}. Score: {$score}/{$totalMaxMarks} ({$percentage}%)."
        );

        return $attempt;
    }
}
