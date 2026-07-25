<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Learning\Services\ResumeLearningService;

class GetContinueLearningAction
{
    public function __construct(
        protected ResumeLearningService $resumeService
    ) {}

    public function execute(User $user): ?array
    {
        return $this->resumeService->getResumeDetails($user);
    }
}
