<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\ApiController;
use App\Domains\Course\Services\PublicExploreService;

class PublicExploreController extends ApiController
{
    protected PublicExploreService $exploreService;

    public function __construct(PublicExploreService $exploreService)
    {
        $this->exploreService = $exploreService;
    }

    /**
     * GET /api/v1/public/explore
     *
     * Returns: published courses with modules/lessons/media, active batches, platform settings,
     * and full academic taxonomy for dynamic frontend rendering directly from the database.
     */
    public function explore()
    {
        $isAuthenticated = auth('sanctum')->check();
        
        $data = $this->exploreService->getExploreData($isAuthenticated);

        return $this->success($data);
    }
}
