<?php

namespace App\Domains\Course\Requests;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Domains\Course\Models\CourseModule;

class UpdateModuleRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $module = CourseModule::findOrFail($this->route('id'));
        return Gate::allows('update', $module->course);
    }

    public function rules(): array
    {
        return [
            'title'      => 'sometimes|string|min:2|max:200',
            'sort_order' => 'sometimes|integer'
        ];
    }
}
