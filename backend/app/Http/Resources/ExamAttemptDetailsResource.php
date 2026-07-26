<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ExamAttemptDetailsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $exam = $this->exam;
        $student = $this->student;
        $questions = $exam ? $exam->questions : [];
        $securityLogs = method_exists($this->resource, 'securityLogs') 
            ? $this->securityLogs()->orderBy('created_at', 'asc')->get() 
            : collect([]);

        $startedAt = $this->started_at ? Carbon::parse($this->started_at) : null;
        $submittedAt = $this->submitted_at ? Carbon::parse($this->submitted_at) : null;
        $durationMinutes = $exam ? $exam->duration_minutes : null;

        // Calculate time used in seconds
        $timeUsedSeconds = null;
        if ($startedAt && $submittedAt) {
            $timeUsedSeconds = $submittedAt->diffInSeconds($startedAt);
        }

        // Format questions
        $formattedQuestions = $questions->map(function ($q) {
            $studentAnswer = $this->answers[$q->id] ?? null;
            $isCorrect = (string)$studentAnswer === (string)$q->correct_answer;
            $awardedMarks = $isCorrect ? ($q->pivot->marks ?? $q->default_marks ?? 1) : 0;
            
            return [
                'id' => $q->id,
                'type' => $q->type,
                'difficulty' => ($q->difficulty && is_object($q->difficulty)) ? $q->difficulty->name : 'Medium',
                'chapter' => ($q->topic && is_object($q->topic) && $q->topic->chapter) ? $q->topic->chapter->name : null,
                'topic' => ($q->topic && is_object($q->topic)) ? $q->topic->name : null,
                'marks' => $q->pivot->marks ?? $q->default_marks ?? 1,
                'negative_marks' => 0, // Implement based on system logic
                'question_text' => $q->content ?? $q->question,
                'options' => $q->options,
                'student_response' => [
                    'selected_answer' => $studentAnswer,
                    'answer_text' => $studentAnswer, // Assuming MCQ option text
                    'time_spent' => null, // Placeholder for future granular tracking
                ],
                'evaluation' => [
                    'correct_answer' => $q->correct_answer,
                    'is_correct' => $isCorrect,
                    'awarded_marks' => $awardedMarks,
                    'auto_graded' => true,
                    'requires_manual_review' => $q->type !== 'mcq',
                ],
            ];
        });

        // Format security logs
        $formattedLogs = $securityLogs->map(function ($log) {
            return [
                'id' => $log->id,
                'time' => $log->created_at->format('H:i:s'),
                'event_type' => $log->event_type,
                'severity' => $log->severity,
                'details' => $log->details,
            ];
        });

        return [
            'summary' => [
                'attempt_id' => $this->id,
                'student' => $student ? [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'avatar' => $student->avatar ?? $student->avatar_url ?? null,
                ] : null,
                'exam' => $exam ? [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'type' => $exam->type,
                ] : null,
                'status' => $this->submitted_at ? 'Submitted' : 'In Progress',
                'started_at' => $this->started_at,
                'submitted_at' => $this->submitted_at,
                'duration_minutes' => $durationMinutes,
                'time_used_seconds' => $timeUsedSeconds,
            ],
            'result' => [
                'total_marks' => $exam ? $exam->total_marks : 0,
                'marks_obtained' => $this->score,
                'percentage' => $this->percentage,
                'passed' => $this->passed,
                'grade' => $this->passed ? 'Pass' : 'Fail', // Enhance with actual grading logic
            ],
            'questions' => $formattedQuestions,
            'security' => [
                'warnings_count' => $securityLogs->where('severity', '!=', 'info')->count(),
                'timeline' => $formattedLogs,
            ],
        ];
    }
}
