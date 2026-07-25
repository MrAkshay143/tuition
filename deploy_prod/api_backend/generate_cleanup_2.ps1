# PowerShell script to clean up the remaining inline validations part 2
$replacements = @(
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\ContentCategoryController.php"
        Old = "public function store(Request `$request)`n    {`n        `$data = `$request->validate([`n            'name' => 'required|string|max:100',`n            'parent_id' => 'nullable|integer|exists:content_categories,id'`n        ]);"
        New = "public function store(\App\Http\Requests\StoreContentCategoryRequest `$request)`n    {`n        `$data = `$request->validated();"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\CourseImportExportController.php"
        Old = "public function import(Request `$request)`n    {`n        `$request->validate([`n            'file' => 'required|file|mimes:zip,json',`n            'format' => 'required|in:standard,scorm'`n        ]);"
        New = "public function import(\App\Http\Requests\ImportCourseRequest `$request)`n    {`n        `$request->validated();"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\CourseVersionController.php"
        Old = "public function createVersion(Request `$request, `$courseId)`n    {`n        `$request->validate(['change_summary' => 'nullable|string|max:250']);"
        New = "public function createVersion(\App\Http\Requests\StoreCourseVersionRequest `$request, `$courseId)`n    {"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\LessonDependencyController.php"
        Old = "public function updateDependencies(Request `$request, `$lessonId)`n    {`n        `$request->validate([`n            'depends_on' => 'required|array',`n            'depends_on.*' => 'integer'`n        ]);"
        New = "public function updateDependencies(\App\Http\Requests\UpdateLessonDependencyRequest `$request, `$lessonId)`n    {"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\LessonOrderController.php"
        Old = "public function updateOrder(Request `$request, `$moduleId)`n    {`n        `$request->validate([`n            'orders' => 'required|array',`n            'orders.*.id' => 'required|integer',`n            'orders.*.order' => 'required|integer'`n        ]);"
        New = "public function updateOrder(\App\Http\Requests\UpdateLessonOrderRequest `$request, `$moduleId)`n    {"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\ModuleOrderController.php"
        Old = "public function updateOrder(Request `$request, `$courseId)`n    {`n        `$request->validate([`n            'orders' => 'required|array',`n            'orders.*.id' => 'required|integer',`n            'orders.*.order' => 'required|integer'`n        ]);"
        New = "public function updateOrder(\App\Http\Requests\UpdateModuleOrderRequest `$request, `$courseId)`n    {"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\ModuleStateController.php"
        Old = "public function toggleCollapse(Request `$request, `$moduleId)`n    {`n        `$request->validate(['collapsed' => 'required|boolean']);"
        New = "public function toggleCollapse(\App\Http\Requests\UpdateModuleStateRequest `$request, `$moduleId)`n    {"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\UserSessionController.php"
        Old = "public function revoke(Request `$request)`n    {`n        `$request->validate(['device_name' => 'required|string|max:100']);"
        New = "public function revoke(\App\Http\Requests\RevokeUserSessionRequest `$request)`n    {"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\Admin\AnnouncementBlastController.php"
        Old = "public function blast(Request `$request)`n    {`n        `$data = `$request->validate([`n            'title' => 'required|string',`n            'body' => 'required|string',`n            'target_roles' => 'required|array'`n        ]);"
        New = "public function blast(\App\Http\Requests\StoreAnnouncementBlastRequest `$request)`n    {`n        `$data = `$request->validated();"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\Admin\OperationsController.php"
        Old = "public function runMaintenance(Request `$request)`n    {`n        `$request->validate([`n            'operation' => 'required|string',`n            'parameters' => 'nullable|array'`n        ]);"
        New = "public function runMaintenance(\App\Http\Requests\RunOperationRequest `$request)`n    {"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\Admin\SessionPolicyController.php"
        Old = "public function store(Request `$request)`n    {`n        `$data = `$request->validate([`n            'role' => 'required|string',`n            'max_sessions' => 'required|integer'`n        ]);"
        New = "public function store(\App\Http\Requests\StoreSessionPolicyRequest `$request)`n    {`n        `$data = `$request->validated();"
    },
    @{
        File = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\Admin\SessionPolicyController.php"
        Old = "public function update(Request `$request, `$id)`n    {`n        `$request->validate([`n            'max_sessions' => 'required|integer'`n        ]);"
        New = "public function update(\App\Http\Requests\UpdateSessionPolicyRequest `$request, `$id)`n    {"
    }
)

foreach ($r in $replacements) {
    if (Test-Path $r.File) {
        $content = [System.IO.File]::ReadAllText($r.File)
        $content = $content.Replace($r.Old, $r.New)
        # Handle cases with \r\n instead of \n
        $oldRn = $r.Old.Replace("`n", "`r`n")
        $newRn = $r.New.Replace("`n", "`r`n")
        $content = $content.Replace($oldRn, $newRn)
        [System.IO.File]::WriteAllText($r.File, $content)
    }
}
Write-Host "Replaced inline validations."
