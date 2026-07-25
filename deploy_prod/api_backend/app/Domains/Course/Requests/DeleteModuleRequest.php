<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\CourseModule;

class DeleteModuleRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $module = CourseModule::findOrFail($this->route('id'));
        return Gate::allows('update', $module->course);
    }

    public function rules(): array
    {
        return [];
    }
}
