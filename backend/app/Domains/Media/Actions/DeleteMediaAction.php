<?php
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
}
