<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Academic\Services\DashboardStatsService;

class AdminAcademicDashboardController extends ApiController
{
    protected DashboardStatsService $statsService;

    public function __construct(DashboardStatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * GET /api/v1/admin/academic/dashboard-stats
     *
     * Returns taxonomy-linked counts and breakdowns for the admin academic dashboard.
     */
    public function getStats(): \Illuminate\Http\JsonResponse
    {
        $stats = $this->statsService->getAcademicStats();
        return $this->success($stats, 'Academic dashboard stats retrieved successfully.');
    }
}
