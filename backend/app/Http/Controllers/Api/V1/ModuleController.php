<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Traits\ApiResponse;
use App\Domains\Course\Models\CourseModule;
use App\Domains\Course\Actions\CreateModuleAction;
use App\Domains\Course\Actions\UpdateModuleAction;
use App\Domains\Course\Actions\DeleteModuleAction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ModuleController extends \App\Http\Controllers\ApiController
{
    public function __construct(
        protected CreateModuleAction $createAction,
        protected UpdateModuleAction $updateAction,
        protected DeleteModuleAction $deleteAction
    ) {}

    public function store(
        \App\Domains\Course\Requests\StoreModuleRequest $request,
        int $courseId
    ): JsonResponse {
        $module = $this->createAction->execute([
            ...$request->validated(),
            'course_id' => $courseId
        ]);

        return $this->success(
            data: $module,
            message: 'Module created successfully.',
            status: 201
        );
    }

    public function update(
        \App\Domains\Course\Requests\UpdateModuleRequest $request,
        int $id
    ): JsonResponse {
        $module = CourseModule::findOrFail($id);
        $module = $this->updateAction->execute($module, $request->validated());

        return $this->success(
            data: $module,
            message: 'Module updated successfully.'
        );
    }

    public function destroy(
        \App\Domains\Course\Requests\DeleteModuleRequest $request,
        int $id
    ): JsonResponse {
        $module = CourseModule::findOrFail($id);
        $this->deleteAction->execute($module);

        return $this->success(message: 'Module deleted successfully.');
    }
}
