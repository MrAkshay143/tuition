<?php

namespace App\Domains\Assessment\Actions;

use App\Domains\Assessment\Models\Assignment;
use App\Domains\Assessment\Models\AssignmentSubmission;
use App\Domains\Media\Services\MediaService;
use App\Domains\Core\Models\ActivityLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;

class SubmitAssignmentAction
{
    protected MediaService $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

    /**
     * Submit an answer or file attachment for an assignment.
     */
    public function execute(Assignment $assignment, \App\Domains\Core\Models\User $user, array $data): AssignmentSubmission
    {
        $submission = AssignmentSubmission::firstOrNew([
            "assignment_id" => $assignment->id,
            "student_id"    => $user->id,
        ]);
        if ($submission->status === "reviewed") throw new \Exception("This assignment has already been graded", 400);

        $mediaId = $data['media_id'] ?? null;
        unset($data['media_id']);

        $submitData = [
            "answer"       => $data["answer"] ?? null,
            "status"       => "submitted",
            "submitted_at" => Carbon::now(),
        ];
        
        $submission->fill($submitData);
        $submission->save();
        
        if ($mediaId) {
            app(\App\Domains\Media\Services\MediaLinkService::class)->link(
                $mediaId,
                AssignmentSubmission::class,
                $submission->id,
                'attachment',
                1,
                false,
                $user->id
            );
        }

        ActivityLog::record(
            'assignment_submitted',
            "Assignment ID {$assignment->id} submitted by Student ID {$user->id} (status: submitted)."
        );
        
        return $submission;
    }
}
