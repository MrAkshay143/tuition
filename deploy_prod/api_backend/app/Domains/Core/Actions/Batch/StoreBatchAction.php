<?php

namespace App\Domains\Core\Actions\Batch;

use App\Domains\Core\Models\Batch;
use App\Models\User;
use App\Models\ActivityLog;

class StoreBatchAction
{
    public function execute(User $actor, array $data): Batch
    {
        $teacherId = $actor->id;
        if ($actor->isAdmin()) {
            if (!empty($data['teacher_id'])) {
                $teacherId = $data['teacher_id'];
            } else {
                $singleTeacher = User::teachers()->first();
                if ($singleTeacher && User::teachers()->count() === 1) {
                    $teacherId = $singleTeacher->id;
                }
            }
        }

        $data['teacher_id'] = $teacherId;

        $batch = Batch::create($data);
        ActivityLog::record('created', "Created batch: {$batch->name}");

        return $batch;
    }
}
