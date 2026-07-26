<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Assessment\Models\Exam;
use App\Domains\Assessment\Models\ExamQuestion;
use App\Domains\Assessment\Models\ExamAttempt;
use Illuminate\Http\Request;

class ExamController extends ApiController
{
    // Teacher and Admin routes

    public function index(
        \App\Domains\Assessment\Requests\GetExamsRequest $request,
        \App\Domains\Assessment\Actions\GetExamsAction $action
    ) {
        $exams = $action->execute($request->user(), $request->all());
        return $this->paginated($exams, 'Exams retrieved successfully');
    }

    public function store(
        \App\Domains\Assessment\Requests\StoreExamRequest $request,
        \App\Domains\Assessment\Actions\StoreExamAction $action
    ) {
        $exam = $action->execute($request->validated(), $request->user()->id);
        return $this->success($exam, 'Exam created successfully', 201);
    }

    public function show(
        \App\Domains\Assessment\Requests\GetExamsRequest $request,
        $id
    ) {
        $exam = Exam::with('batches')->findOrFail($id);

        if ($request->user()->isTeacher() && $exam->teacher_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $exam->loadCount('attempts');
        return $this->success($exam, 'Exam details retrieved successfully');
    }

    public function update(
        \App\Domains\Assessment\Requests\UpdateExamRequest $request,
        \App\Domains\Assessment\Actions\UpdateExamAction $action,
        $exam
    ) {
        $model = $exam instanceof Exam ? $exam : Exam::findOrFail($exam);
        $model = $action->execute($model, $request->validated());
        return $this->success($model, 'Exam updated successfully');
    }

    public function destroy(
        \App\Domains\Assessment\Requests\DeleteExamRequest $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        $exam->delete();
        return $this->success(null, 'Exam deleted successfully');
    }

    public function attempts(\Illuminate\Http\Request $request, $id)
    {
        $exam = Exam::findOrFail($id);
        $attempts = ExamAttempt::with('student:id,name,email,avatar')
            ->where('exam_id', $id)
            ->latest('started_at')
            ->get();

        return $this->success($attempts, 'Exam attempts retrieved successfully');
    }

    public function attemptDetails(\Illuminate\Http\Request $request, $id, $attemptId)
    {
        $attempt = ExamAttempt::with(['student:id,name,email,avatar', 'exam.questions.topic.chapter', 'exam.questions.difficulty'])
            ->where('exam_id', $id)
            ->findOrFail($attemptId);

        return $this->success(
            new \App\Http\Resources\ExamAttemptDetailsResource($attempt),
            'Exam attempt details retrieved successfully'
        );
    }

    // Exam question management

    public function questions(
        \Illuminate\Http\Request $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        $questions = $exam->questions->map(function ($q) {
            return [
                'id'             => $q->id,
                'question'       => $q->content ?? $q->question,
                'type'           => $q->type,
                'marks'          => $q->pivot->marks ?? $q->default_marks ?? 1,
                'options'        => $q->options,
                'correct_answer' => $q->correct_answer,
                'sort_order'     => $q->pivot->sort_order ?? 1,
            ];
        });
        return $this->success($questions, 'Exam questions retrieved successfully');
    }

    public function addQuestion(
        \Illuminate\Http\Request $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        $validated = $request->validate([
            'question'       => 'required|string',
            'type'           => 'required|string',
            'marks'          => 'required|numeric|min:1',
            'options'        => 'nullable|array',
            'correct_answer' => 'nullable|string',
            'sort_order'     => 'nullable|integer',
        ]);

        $question = \App\Domains\Assessment\Models\Question::create([
            'teacher_id'     => $request->user()->id,
            'content'        => $validated['question'],
            'type'           => $validated['type'],
            'options'        => $validated['options'] ?? null,
            'correct_answer' => $validated['correct_answer'] ?? null,
            'default_marks'  => $validated['marks'],
            'is_active'      => true,
        ]);

        $sortOrder = $validated['sort_order'] ?? ($exam->questions()->count() + 1);
        $exam->questions()->attach($question->id, [
            'marks'      => $validated['marks'],
            'sort_order' => $sortOrder,
        ]);

        $res = [
            'id'             => $question->id,
            'question'       => $question->content,
            'type'           => $question->type,
            'marks'          => $validated['marks'],
            'options'        => $question->options,
            'correct_answer' => $question->correct_answer,
            'sort_order'     => $sortOrder,
        ];

        return $this->success($res, 'Question added successfully', 201);
    }

    public function attachQuestion(
        \Illuminate\Http\Request $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        $validated = $request->validate([
            'question_ids'   => 'required|array',
            'question_ids.*' => 'exists:questions,id',
            'marks'          => 'required|numeric|min:1',
            'sort_order'     => 'nullable|integer',
        ]);

        $startOrder = $validated['sort_order'] ?? ($exam->questions()->count() + 1);
        
        $syncData = [];
        foreach ($validated['question_ids'] as $index => $qId) {
            $syncData[$qId] = [
                'marks'      => $validated['marks'],
                'sort_order' => $startOrder + $index,
            ];
        }

        $exam->questions()->syncWithoutDetaching($syncData);

        return $this->success(null, 'Questions attached to exam successfully');
    }

    public function updateQuestion(
        \Illuminate\Http\Request $request,
        $id,
        $qId
    ) {
        $exam = Exam::findOrFail($id);
        $question = \App\Domains\Assessment\Models\Question::findOrFail($qId);

        $validated = $request->validate([
            'question'       => 'sometimes|required|string',
            'type'           => 'sometimes|required|string',
            'marks'          => 'sometimes|required|numeric|min:1',
            'options'        => 'nullable|array',
            'correct_answer' => 'nullable|string',
            'sort_order'     => 'nullable|integer',
        ]);

        if (isset($validated['question'])) $question->content = $validated['question'];
        if (isset($validated['type'])) $question->type = $validated['type'];
        if (array_key_exists('options', $validated)) $question->options = $validated['options'];
        if (array_key_exists('correct_answer', $validated)) $question->correct_answer = $validated['correct_answer'];
        $question->save();

        if (isset($validated['marks']) || isset($validated['sort_order'])) {
            $pivotData = [];
            if (isset($validated['marks'])) $pivotData['marks'] = $validated['marks'];
            if (isset($validated['sort_order'])) $pivotData['sort_order'] = $validated['sort_order'];
            $exam->questions()->updateExistingPivot($qId, $pivotData);
        }

        return $this->success(null, 'Question updated successfully');
    }

    public function removeQuestion(
        \Illuminate\Http\Request $request,
        $id,
        $qId
    ) {
        $exam = Exam::findOrFail($id);
        $exam->questions()->detach($qId);
        return $this->success(null, 'Question removed successfully');
    }

    public function syncQuestions(
        \Illuminate\Http\Request $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        $data = $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'required|exists:questions,id',
            'questions.*.marks' => 'required|integer',
            'questions.*.sort_order' => 'required|integer',
        ]);
        
        $syncData = [];
        foreach ($data['questions'] as $q) {
            $syncData[$q['id']] = ['marks' => $q['marks'], 'sort_order' => $q['sort_order']];
        }
        
        $exam->questions()->sync($syncData);
        return $this->success(null, 'Exam questions synced successfully');
    }

    // Student portal routes

    public function studentIndex(
        \App\Domains\Assessment\Requests\GetExamsRequest $request,
        \App\Domains\Assessment\Actions\GetStudentExamsAction $action
    ) {
        $exams = $action->execute($request->user());
        return $this->paginated($exams, 'Student exams retrieved successfully');
    }

    public function start(
        \App\Domains\Assessment\Requests\StartExamRequest $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        $user = $request->user();

        // Verify student belongs to a batch that has this exam
        $hasExam = $exam->batches()
            ->whereIn('batches.id', $user->batches()->pluck('batches.id'))
            ->exists();

        if (!$hasExam) {
            return $this->error('You are not assigned to this exam', 403);
        }

        $now = now();
        if ($exam->starts_at && $now->lt($exam->starts_at)) {
            return $this->error('Exam has not started yet', 400);
        }
        if ($exam->ends_at && $now->gt($exam->ends_at)) {
            return $this->error('Exam has expired', 400);
        }

        $existingAttempt = ExamAttempt::firstOrCreate([
            'exam_id'    => $id,
            'student_id' => $user->id,
        ], [
            'started_at' => now(),
        ]);

        if ($existingAttempt->submitted_at) {
            return $this->error('You have already submitted this exam', 400);
        }

        $questions = $exam->questions()->select('id', 'question', 'type', 'options', 'marks', 'sort_order')->get();
        if ($exam->shuffle_questions) {
            $questions = $questions->shuffle();
        }

        return $this->success([
            'attempt'   => $existingAttempt,
            'exam'      => $exam,
            'questions' => $questions
        ], 'Exam started successfully');
    }

    public function submit(
        \App\Domains\Assessment\Requests\SubmitExamRequest $request,
        \App\Domains\Assessment\Actions\SubmitExamAction $action,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        try {
            $attempt = $action->execute($exam, $request->user(), $request->validated()['answers']);
            return $this->success([
                'attempt' => $attempt,
                'show_result' => $exam->show_result_immediately
            ], 'Exam submitted successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function logSecurityEvent(
        \Illuminate\Http\Request $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        
        $validated = $request->validate([
            'event_type' => 'required|string',
            'severity'   => 'nullable|string',
            'details'    => 'nullable|array'
        ]);

        $attempt = ExamAttempt::where('exam_id', $id)
            ->where('student_id', $request->user()->id)
            ->latest('started_at')
            ->first();

        if (!$attempt) {
            return $this->error('No active exam attempt found', 404);
        }

        \App\Domains\Assessment\Models\ExamSecurityLog::create([
            'exam_attempt_id' => $attempt->id,
            'user_id'         => $request->user()->id,
            'exam_id'         => $id,
            'event_type'      => $validated['event_type'],
            'severity'        => $validated['severity'] ?? 'info',
            'ip'              => $request->ip(),
            'user_agent'      => $request->userAgent(),
            'details'         => $validated['details'] ?? []
        ]);

        return $this->success(null, 'Security event logged');
    }

    public function studentResult(\Illuminate\Http\Request $request, $id)
    {
        $exam = Exam::with(['questions.topic.chapter', 'questions.difficulty'])->findOrFail($id);
        $attempt = ExamAttempt::with(['student:id,name,email,avatar'])
            ->where('exam_id', $id)
            ->where('student_id', $request->user()->id)
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->first();

        if (!$attempt) {
            $attempt = ExamAttempt::with(['student:id,name,email,avatar'])
                ->where('exam_id', $id)
                ->where('student_id', $request->user()->id)
                ->latest('started_at')
                ->first();
        }

        if (!$attempt) {
            return $this->error('No exam attempt found.', 404);
        }
        
        $attempt->setRelation('exam', $exam);
        
        // Hide questions from student if show_result_immediately is false
        if (!$exam->show_result_immediately) {
            $exam->setRelation('questions', collect([]));
        }

        return $this->success(
            new \App\Http\Resources\ExamAttemptDetailsResource($attempt),
            'Exam result retrieved successfully'
        );
    }
}
