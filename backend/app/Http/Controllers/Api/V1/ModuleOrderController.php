<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Actions\ReorderModulesAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModuleOrderController extends ApiController
{
    use ApiResponse;

    protected ReorderModulesAction $reorderAction;

    public function __construct(ReorderModulesAction $reorderAction)
    {
        $this->reorderAction = $reorderAction;
    }

    /**
     * PATCH /api/v1/courses/{courseId}/modules/reorder
     */
    public function __invoke(Request $request, int $courseId): JsonResponse
    {
        $request->validate([
            'module_ids'   => 'required|array',
            'module_ids.*' => 'required|integer|exists:course_modules,id'
        ]);

        $this->reorderAction->execute($request->module_ids);

        return $this->success(null, 'Modules reordered successfully.');
    }
}
