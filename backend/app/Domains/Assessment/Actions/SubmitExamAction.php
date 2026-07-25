<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Exam;
use App\Domains\Assessment\Models\ExamAttempt;
use App\Domains\Core\Models\User;

class SubmitExamAction
{
    public function execute(Exam $exam, User $user, array $answers)
    {
        $attempt = ExamAttempt::where("exam_id", $exam->id)->where("student_id", $user->id)->firstOrFail();
        if ($attempt->submitted_at) throw new \Exception("Exam already submitted", 400);

        $score = 0;
        $questions = $exam->questions->keyBy("id");
        foreach ($answers as $qId => $answerStr) {
            $question = $questions->get($qId);
            if ($question && $question->type === "mcq") {
                if (trim(strtolower($question->correct_answer)) === trim(strtolower($answerStr))) {
                    $score += $question->marks;
                }
            }
        }
        $percentage = ($exam->total_marks > 0) ? ($score / $exam->total_marks) * 100 : 0;
        $passed = $score >= $exam->pass_marks;
        $attempt->update([
            "answers"      => $answers,
            "score"        => $score,
            "percentage"   => $percentage,
            "passed"       => $passed,
            "submitted_at" => now(),
        ]);
        return $attempt;
    }
}
