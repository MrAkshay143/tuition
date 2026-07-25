<?php

namespace App\Domains\Learning\Services;

use App\Domains\Core\Models\User;
use App\Domains\Learning\Actions\ResumeLearningAction;

class ResumeLearningService
{
    protected $resumeAction;

    public function __construct(ResumeLearningAction $resumeAction)
    {
        $this->resumeAction = $resumeAction;
    }

    public function getResumeDetails(User $user): ?array
    {
        return $this->resumeAction->execute($user);
    }
}
