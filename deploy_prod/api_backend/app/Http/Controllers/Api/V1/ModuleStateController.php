<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\ModuleState;
use App\Domains\Course\Models\CourseModule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModuleStateController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/v1/modules/{moduleId}/state
     */
    public function __invoke(Request $request, int $moduleId): JsonResponse
    {
        CourseModule::findOrFail($moduleId);
        $userId = $request->user()?->id ?? 1;

        $request->validate(['collapsed' => 'required|boolean']);

        $state = ModuleState::updateOrCreate(
            ['teacher_id' => $userId, 'module_id' => $moduleId],
            ['collapsed'  => $request->collapsed]
        );

        return $this->success($state, 'Module collapse state updated successfully.');
    }
}
