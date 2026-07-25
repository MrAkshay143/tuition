# PowerShell script to clean up the rest of the inline validations

# 3. MediaController
$mediaReqDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Media\Requests"
Set-Content -Path "$mediaReqDir\BulkMediaRequest.php" -Value '<?php namespace App\Domains\Media\Requests; use App\Http\Requests\ApiFormRequest; class BulkMediaRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["ids" => "required|array", "ids.*" => "integer"]; } }'
Set-Content -Path "$mediaReqDir\BulkCategoryMediaRequest.php" -Value '<?php namespace App\Domains\Media\Requests; use App\Http\Requests\ApiFormRequest; class BulkCategoryMediaRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["ids" => "required|array", "ids.*" => "integer", "category_id" => "nullable|integer|exists:content_categories,id"]; } }'

$mediaCtrl = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\MediaController.php"
$mediaContent = Get-Content -Path $mediaCtrl -Raw
$mediaContent = $mediaContent -replace 'public function bulkDelete\(Request \$request\): JsonResponse\s*\{\s*\$request->validate\(\[''ids'' => ''required\|array'', ''ids\.\*'' => ''integer''\]\);', 'public function bulkDelete(\App\Domains\Media\Requests\BulkMediaRequest $request): JsonResponse { '
$mediaContent = $mediaContent -replace 'public function bulkPublish\(Request \$request\): JsonResponse\s*\{\s*\$request->validate\(\[''ids'' => ''required\|array'', ''ids\.\*'' => ''integer''\]\);', 'public function bulkPublish(\App\Domains\Media\Requests\BulkMediaRequest $request): JsonResponse { '
$mediaContent = $mediaContent -replace 'public function bulkArchive\(Request \$request\): JsonResponse\s*\{\s*\$request->validate\(\[''ids'' => ''required\|array'', ''ids\.\*'' => ''integer''\]\);', 'public function bulkArchive(\App\Domains\Media\Requests\BulkMediaRequest $request): JsonResponse { '
$mediaContent = $mediaContent -replace 'public function bulkCategory\(Request \$request\): JsonResponse\s*\{\s*\$request->validate\(\[\s*''ids'' => ''required\|array'',\s*''ids\.\*'' => ''integer'',\s*''category_id'' => ''nullable\|integer\|exists:content_categories,id''\s*\]\);', 'public function bulkCategory(\App\Domains\Media\Requests\BulkCategoryMediaRequest $request): JsonResponse { '
Set-Content -Path $mediaCtrl -Value $mediaContent

# 4. BookmarkController
$bmReqDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Core\Requests"
New-Item -ItemType Directory -Force -Path $bmReqDir | Out-Null
Set-Content -Path "$bmReqDir\ToggleBookmarkRequest.php" -Value '<?php namespace App\Domains\Core\Requests; use App\Http\Requests\ApiFormRequest; class ToggleBookmarkRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["type" => "required|string|in:course,lesson,media", "id" => "required|integer"]; } }'
$bmCtrl = "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\V1\BookmarkController.php"
$bmContent = Get-Content -Path $bmCtrl -Raw
$bmContent = $bmContent -replace 'public function toggle\(Request \$request\)\s*\{\s*\$validated = \$request->validate\(\[\s*''type'' => ''required\|string\|in:course,lesson,media'',\s*''id''\s*=> ''required\|integer''\s*\]\);', 'public function toggle(\App\Domains\Core\Requests\ToggleBookmarkRequest $request) { $validated = $request->validated();'
Set-Content -Path $bmCtrl -Value $bmContent

Write-Host "Part 1 refactored"
