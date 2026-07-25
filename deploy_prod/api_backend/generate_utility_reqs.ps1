# PowerShell script to create missing FormRequests
$reqs = @{
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\StoreContentCategoryRequest.php" = '<?php namespace App\Http\Requests; class StoreContentCategoryRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["name" => "required|string|max:100", "parent_id" => "nullable|integer|exists:content_categories,id"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\ImportCourseRequest.php" = '<?php namespace App\Http\Requests; class ImportCourseRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["file" => "required|file|mimes:zip,json", "format" => "required|in:standard,scorm"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\StoreCourseVersionRequest.php" = '<?php namespace App\Http\Requests; class StoreCourseVersionRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["change_summary" => "nullable|string|max:250"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\UpdateLessonDependencyRequest.php" = '<?php namespace App\Http\Requests; class UpdateLessonDependencyRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["depends_on" => "required|array", "depends_on.*" => "integer"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\UpdateLessonOrderRequest.php" = '<?php namespace App\Http\Requests; class UpdateLessonOrderRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["orders" => "required|array", "orders.*.id" => "required|integer", "orders.*.order" => "required|integer"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\UpdateModuleOrderRequest.php" = '<?php namespace App\Http\Requests; class UpdateModuleOrderRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["orders" => "required|array", "orders.*.id" => "required|integer", "orders.*.order" => "required|integer"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\UpdateModuleStateRequest.php" = '<?php namespace App\Http\Requests; class UpdateModuleStateRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["collapsed" => "required|boolean"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\RevokeUserSessionRequest.php" = '<?php namespace App\Http\Requests; class RevokeUserSessionRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["device_name" => "required|string|max:100"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\StoreAnnouncementBlastRequest.php" = '<?php namespace App\Http\Requests; class StoreAnnouncementBlastRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["title" => "required|string", "body" => "required|string", "target_roles" => "required|array"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\RunOperationRequest.php" = '<?php namespace App\Http\Requests; class RunOperationRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["operation" => "required|string", "parameters" => "nullable|array"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\StoreSessionPolicyRequest.php" = '<?php namespace App\Http\Requests; class StoreSessionPolicyRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["role" => "required|string", "max_sessions" => "required|integer"]; } }'
    
    "c:\Dev\Projects\Online Tuition\backend\app\Http\Requests\UpdateSessionPolicyRequest.php" = '<?php namespace App\Http\Requests; class UpdateSessionPolicyRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["max_sessions" => "required|integer"]; } }'
}

foreach ($key in $reqs.Keys) {
    Set-Content -Path $key -Value $reqs[$key]
}

Write-Host "12 Utility FormRequests created!"
