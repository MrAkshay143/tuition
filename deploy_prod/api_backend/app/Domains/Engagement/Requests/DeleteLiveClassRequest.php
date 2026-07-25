<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\LiveClass\Models\LiveClass;
class DeleteLiveClassRequest extends ApiFormRequest {
    public function authorize(): bool {
        $liveClass = LiveClass::findOrFail($this->route("id"));
        if ($this->user()->isTeacher() && $liveClass->teacher_id !== $this->user()->id) return false;
        return $this->user()->isAdmin() || $this->user()->isTeacher();
    }
    public function rules(): array { return []; }
}
