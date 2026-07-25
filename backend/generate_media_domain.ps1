# PowerShell script to create Media domain classes
$baseDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Media"
$requestsDir = "$baseDir\Requests"
$actionsDir = "$baseDir\Actions"

New-Item -ItemType Directory -Force -Path $requestsDir | Out-Null
New-Item -ItemType Directory -Force -Path $actionsDir | Out-Null

# 1. GetMediaRequest
Set-Content -Path "$requestsDir\GetMediaRequest.php" -Value '<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
class GetMediaRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'

# 2. GetMediaItemRequest
Set-Content -Path "$requestsDir\GetMediaItemRequest.php" -Value '<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class GetMediaItemRequest extends ApiFormRequest {
    public function authorize(): bool {
        $media = Media::findOrFail($this->route("id"));
        return Gate::allows("view", $media);
    }
    public function rules(): array { return []; }
}'

# 3. StoreMediaRequest
Set-Content -Path "$requestsDir\StoreMediaRequest.php" -Value '<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class StoreMediaRequest extends ApiFormRequest {
    public function authorize(): bool { return Gate::allows("create", Media::class); }
    public function rules(): array {
        return [
            "file" => "required|file|max:2097152",
            "title" => "sometimes|string|max:255",
            "description" => "sometimes|nullable|string",
            "category_id" => "sometimes|nullable|integer|exists:content_categories,id",
            "visibility" => "sometimes|in:private,published,archived",
            "publish_at" => "sometimes|nullable|date",
            "tags" => "sometimes|nullable|string",
            "link_entities" => "sometimes|array",
            "link_entities.*.type" => "required_with:link_entities|string",
            "link_entities.*.id" => "required_with:link_entities|integer",
            "link_entities.*.link_type" => "sometimes|string",
        ];
    }
}'

# 4. ImportYoutubeRequest
Set-Content -Path "$requestsDir\ImportYoutubeRequest.php" -Value '<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class ImportYoutubeRequest extends ApiFormRequest {
    public function authorize(): bool { return Gate::allows("create", Media::class); }
    public function rules(): array {
        return [
            "youtube_url" => "required|url",
            "title" => "sometimes|string|max:255",
            "description" => "sometimes|nullable|string",
            "category_id" => "sometimes|nullable|integer|exists:content_categories,id",
            "visibility" => "sometimes|in:private,published,archived",
            "publish_at" => "sometimes|nullable|date",
            "tags" => "sometimes|nullable|string",
            "link_entities" => "sometimes|array",
        ];
    }
}'

# 5. UpdateMediaRequest
Set-Content -Path "$requestsDir\UpdateMediaRequest.php" -Value '<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class UpdateMediaRequest extends ApiFormRequest {
    public function authorize(): bool {
        $media = Media::findOrFail($this->route("id"));
        return Gate::allows("update", $media);
    }
    public function rules(): array {
        return [
            "name" => "sometimes|string|max:255",
            "description" => "sometimes|nullable|string",
            "category_id" => "sometimes|nullable|integer|exists:content_categories,id",
            "visibility" => "sometimes|in:private,published,archived",
            "publish_at" => "sometimes|nullable|date",
            "status" => "sometimes|in:draft,published,scheduled,archived",
            "tags" => "sometimes|nullable|string",
        ];
    }
}'

# 6. DeleteMediaRequest
Set-Content -Path "$requestsDir\DeleteMediaRequest.php" -Value '<?php
namespace App\Domains\Media\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Media\Models\Media;
use Illuminate\Support\Facades\Gate;
class DeleteMediaRequest extends ApiFormRequest {
    public function authorize(): bool {
        $media = Media::findOrFail($this->route("id"));
        return Gate::allows("delete", $media);
    }
    public function rules(): array { return []; }
}'

# 7. GetMediaAction
Set-Content -Path "$actionsDir\GetMediaAction.php" -Value '<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Repositories\MediaRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
class GetMediaAction {
    public function __construct(protected MediaRepository $repo) {}
    public function execute(array $filters, int $perPage): LengthAwarePaginator {
        return $this->repo->getPaginated($filters, $perPage);
    }
}'

# 8. StoreMediaAction
Set-Content -Path "$actionsDir\StoreMediaAction.php" -Value '<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class StoreMediaAction {
    public function __construct(protected MediaService $service) {}
    public function execute($file, array $data, int $userId): Media {
        return $this->service->uploadFile($file, $data, $userId);
    }
}'

# 9. ImportYoutubeAction
Set-Content -Path "$actionsDir\ImportYoutubeAction.php" -Value '<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class ImportYoutubeAction {
    public function __construct(protected MediaService $service) {}
    public function execute(array $data, int $userId): Media {
        return $this->service->importYoutube($data, $userId);
    }
}'

# 10. UpdateMediaAction
Set-Content -Path "$actionsDir\UpdateMediaAction.php" -Value '<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class UpdateMediaAction {
    public function __construct(protected MediaService $service) {}
    public function execute(Media $media, array $data, int $userId): Media {
        return $this->service->updateMetadata($media, $data, $userId);
    }
}'

# 11. DeleteMediaAction
Set-Content -Path "$actionsDir\DeleteMediaAction.php" -Value '<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class DeleteMediaAction {
    public function __construct(protected MediaService $service) {}
    public function execute(Media $media, bool $force, int $userId): void {
        if ($force) {
            $this->service->forceDelete($media, $userId);
        } else {
            $this->service->softDelete($media, $userId);
        }
    }
}'

Write-Host "Created Requests and Actions!"
