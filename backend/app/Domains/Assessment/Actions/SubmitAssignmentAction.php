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
        return \Illuminate\Support\Facades\DB::transaction(function () use ($assignment, $user, $data) {
            $submission = AssignmentSubmission::where('assignment_id', $assignment->id)
                ->where('student_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$submission) {
                $submission = new AssignmentSubmission([
                    'assignment_id' => $assignment->id,
                    'student_id'    => $user->id,
                ]);
            }

            if ($submission->status === "reviewed") {
                throw new \Exception("This assignment has already been graded", 422);
            }

            if ($assignment->due_at && Carbon::now()->greaterThan($assignment->due_at)) {
                throw new \Exception("The deadline for this assignment has passed", 422);
            }

            $mediaId = $data['media_id'] ?? null;
            if ($mediaId) {
                $media = \App\Domains\Media\Models\Media::find($mediaId);
                if ($media) {
                    if ($media->size > 10 * 1024 * 1024) {
                        throw new \Exception("Attachment size exceeds 10MB limit.", 400);
                    }
                    $allowedExts = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp4', 'zip'];
                    $ext = strtolower(pathinfo($media->file_name, PATHINFO_EXTENSION) ?: $media->extension);
                    if (!in_array($ext, $allowedExts)) {
                        throw new \Exception("Invalid file type: {$ext}. Allowed: pdf, docx, jpg, png, mp4, zip.", 400);
                    }
                }
            }

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
        });
    }
}
