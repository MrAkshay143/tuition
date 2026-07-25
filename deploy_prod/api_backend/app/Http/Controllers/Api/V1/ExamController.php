<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Assessment\Models\Exam;
use App\Domains\Assessment\Models\ExamQuestion;
use App\Domains\Assessment\Models\ExamAttempt;
use Illuminate\Http\Request;

class ExamController extends ApiController
{
    // ── TEACHER / ADMIN ROUTES ──────────────────────────────────────────────

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

    // ── QUESTIONS MANAGEMENT ──────────────────────────────────────────────

    public function questions(
        \Illuminate\Http\Request $request,
        $id
    ) {
        $exam = Exam::findOrFail($id);
        return $this->success($exam->questions, 'Exam questions retrieved successfully');
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

    // ── STUDENT ROUTES ────────────────────────────────────────────────────

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
}
