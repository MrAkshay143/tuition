<?php

$teacher = \App\Models\User::where('email', 'teacher@eduflow.test')->first();
$student = \App\Models\User::where('role', 'student')->first();
echo 'Teacher found: ' . ($teacher ? 'Yes' : 'No') . "\n";
echo 'Student found: ' . ($student ? 'Yes (' . $student->email . ')' : 'No') . "\n";

$exam = \App\Domains\Assessment\Models\Exam::first();
if ($exam) {
    echo 'Exam found: ' . $exam->id . "\n";
    $attempt = \App\Domains\Assessment\Models\ExamAttempt::where('exam_id', $exam->id)->first();
    if ($attempt) {
        echo 'Attempt found: ' . $attempt->id . "\n";
        $attempt->load('student');
        $attempt->setRelation('exam', $exam);
        $resource = new \App\Http\Resources\ExamAttemptDetailsResource($attempt);
        $data = $resource->resolve();
        echo 'Resource keys: ' . implode(', ', array_keys($data)) . "\n";
        echo 'Success! Structure is valid.' . "\n";
    } else {
        echo "No attempt found.\n";
    }
} else {
    echo "No exam found.\n";
}
