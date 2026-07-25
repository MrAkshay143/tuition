<?php
$files = [
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\ContentCategoryController.php' => [
        '/public function store\(Request \$request\)\s*\{\s*\$data = \$request->validate\(\[.*?\]\);/s',
        'public function store(\App\Http\Requests\StoreContentCategoryRequest $request) { $data = $request->validated();'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\CourseImportExportController.php' => [
        '/public function import\(Request \$request\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function import(\App\Http\Requests\ImportCourseRequest $request) { $request->validated();'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\CourseVersionController.php' => [
        '/public function createVersion\(Request \$request, \$courseId\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function createVersion(\App\Http\Requests\StoreCourseVersionRequest $request, $courseId) {'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\LessonDependencyController.php' => [
        '/public function updateDependencies\(Request \$request, \$lessonId\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function updateDependencies(\App\Http\Requests\UpdateLessonDependencyRequest $request, $lessonId) {'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\LessonOrderController.php' => [
        '/public function updateOrder\(Request \$request, \$moduleId\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function updateOrder(\App\Http\Requests\UpdateLessonOrderRequest $request, $moduleId) {'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\ModuleOrderController.php' => [
        '/public function updateOrder\(Request \$request, \$courseId\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function updateOrder(\App\Http\Requests\UpdateModuleOrderRequest $request, $courseId) {'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\ModuleStateController.php' => [
        '/public function toggleCollapse\(Request \$request, \$moduleId\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function toggleCollapse(\App\Http\Requests\UpdateModuleStateRequest $request, $moduleId) {'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\UserSessionController.php' => [
        '/public function revoke\(Request \$request\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function revoke(\App\Http\Requests\RevokeUserSessionRequest $request) {'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\Admin\AnnouncementBlastController.php' => [
        '/public function blast\(Request \$request\)\s*\{\s*\$data = \$request->validate\(\[.*?\]\);/s',
        'public function blast(\App\Http\Requests\StoreAnnouncementBlastRequest $request) { $data = $request->validated();'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\Admin\OperationsController.php' => [
        '/public function runMaintenance\(Request \$request\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function runMaintenance(\App\Http\Requests\RunOperationRequest $request) {'
    ],
    'c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\Admin\SessionPolicyController.php' => [
        '/public function store\(Request \$request\)\s*\{\s*\$data = \$request->validate\(\[.*?\]\);/s',
        'public function store(\App\Http\Requests\StoreSessionPolicyRequest $request) { $data = $request->validated();',
        '/public function update\(Request \$request, \$id\)\s*\{\s*\$request->validate\(\[.*?\]\);/s',
        'public function update(\App\Http\Requests\UpdateSessionPolicyRequest $request, $id) {'
    ]
];

foreach ($files as $file => $replacements) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (isset($replacements[2])) {
            $content = preg_replace($replacements[0], $replacements[1], $content);
            $content = preg_replace($replacements[2], $replacements[3], $content);
        } else {
            $content = preg_replace($replacements[0], $replacements[1], $content);
        }
        file_put_contents($file, $content);
        echo "Updated $file\n";
    } else {
        echo "Missing $file\n";
    }
}
