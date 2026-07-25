<?php

namespace App\Domains\CMS\Services;

use App\Domains\CMS\Repositories\AchievementRepository;
use App\Domains\CMS\Models\Achievement;

class AchievementService
{
    public function __construct(private AchievementRepository $repository)
    {
    }

    public function createAchievement(array $data): Achievement
    {
        return $this->repository->create($data);
    }

    public function updateAchievement(Achievement $achievement, array $data): bool
    {
        return $this->repository->update($achievement, $data);
    }
}
