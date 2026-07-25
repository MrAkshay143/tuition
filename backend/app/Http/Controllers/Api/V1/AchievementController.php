<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domains\CMS\Repositories\AchievementRepository;

class AchievementController extends Controller
{
    public function __construct(private AchievementRepository $repository) {}

    public function index(Request $request)
    {
        $perPage = $request->integer('per_page', 20);
        // Only fetch published achievements
        $filters = ['is_published' => true];
        
        $achievements = $this->repository->getAllPaginated($perPage, $filters);
        
        return response()->json($achievements);
    }
}
