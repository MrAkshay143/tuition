<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Assessment\Models\Assignment;
use App\Domains\Assessment\Models\AssignmentSubmission;
use Illuminate\Http\Request;

class AssignmentController extends ApiController
{
    public function index(
        \App\Domains\Assessment\Requests\GetAssignmentsRequest $request,
        \App\Domains\Assessment\Actions\GetAssignmentsAction $action
    ) {
        $assignments = $action->execute($request->user(), $request->all());
        return $this->paginated($assignments, 'Assignments retrieved successfully');
    }

    public function store(
        \App\Domains\Assessment\Requests\StoreAssignmentRequest $request,
        \App\Domains\Assessment\Actions\StoreAssignmentAction $action
    ) {
        $assignment = $action->execute($request->validated(), $request->user()->id);
        return $this->success($assignment, 'Assignment created successfully', 201);
    }

    public function show(
        \App\Domains\Assessment\Requests\GetAssignmentsRequest $request,
        $id
    ) {
        $assignment = Assignment::with(['batches', 'attachedMedia'])->findOrFail($id);

        if ($request->user()->isTeacher() && $assignment->teacher_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $assignment->loadCount([
            'submissions',
            'submissions as pending_count' => function ($query) {
                $query->where('status', 'submitted');
            }
        ]);

        return $this->success($assignment, 'Assignment details retrieved successfully');
    }

    public function update(
        \App\Domains\Assessment\Requests\UpdateAssignmentRequest $request,
        \App\Domains\Assessment\Actions\UpdateAssignmentAction $action,
        $assignment
    ) {
        $model = $assignment instanceof Assignment ? $assignment : Assignment::findOrFail($assignment);
        $model = $action->execute($model, $request->validated());
        $model->load('attachedMedia');
        return $this->success($model, 'Assignment updated successfully');
    }

    public function destroy(
        \App\Domains\Assessment\Requests\DeleteAssignmentRequest $request,
        $id
    ) {
        $assignment = Assignment::findOrFail($id);
        $assignment->delete();
        return $this->success(null, 'Assignment deleted successfully');
    }

    public function submissions(
        \App\Domains\Assessment\Requests\GetAssignmentSubmissionsRequest $request,
        $id
    ) {
        $submissions = AssignmentSubmission::with(['student:id,name,email,avatar', 'attachedMedia'])
            ->where('assignment_id', $id)
            ->latest('submitted_at')
            ->paginate(20);

        return $this->paginated($submissions, 'Submissions retrieved successfully');
    }

    public function grade(
        \App\Domains\Assessment\Requests\GradeAssignmentRequest $request,
        \App\Domains\Assessment\Actions\GradeAssignmentAction $action,
        $id,
        $submissionId
    ) {
        $submission = AssignmentSubmission::where('assignment_id', $id)->findOrFail($submissionId);
        $submission = $action->execute($submission, $request->validated());
        return $this->success($submission, 'Submission graded successfully');
    }

    public function studentIndex(
        \App\Domains\Assessment\Requests\GetAssignmentsRequest $request,
        \App\Domains\Assessment\Actions\GetStudentAssignmentsAction $action
    ) {
        $assignments = $action->execute($request->user());
        return $this->paginated($assignments, 'Student assignments retrieved successfully');
    }

    public function submit(
        \App\Domains\Assessment\Requests\SubmitAssignmentRequest $request,
        \App\Domains\Assessment\Actions\SubmitAssignmentAction $action,
        $id
    ) {
        $assignment = Assignment::findOrFail($id);

        // Verify student belongs to a batch that has this assignment
        $hasAssignment = $assignment->batches()
            ->whereIn('batches.id', $request->user()->batches()->pluck('batches.id'))
            ->exists();

        if (!$hasAssignment) {
            return $this->error('You are not assigned to this assignment', 403);
        }

        if (!$request->filled('answer') && !$request->filled('media_id')) {
            return $this->error('You must provide either an answer text or an attached media file', 422);
        }

        try {
            $submission = $action->execute($assignment, $request->user(), $request->validated());
            return $this->success($submission, 'Assignment submitted successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 400);
        }
    }
}
