<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class UpdateNotificationPreferencesRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            "in_app"               => "boolean",
            "email"                => "boolean",
            "push"                 => "boolean",
            "live_class_reminder"  => "boolean",
            "assignment_due"       => "boolean",
            "exam_reminder"        => "boolean",
            "new_content"          => "boolean",
        ];
    }
}
