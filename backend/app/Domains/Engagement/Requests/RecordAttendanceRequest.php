<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class RecordAttendanceRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            "duration_minutes" => "required|integer|min:1",
            "device_info"      => "nullable|string"
        ];
    }
}
