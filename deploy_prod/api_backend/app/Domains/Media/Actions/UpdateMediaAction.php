<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class UpdateMediaAction {
    public function __construct(protected MediaService $service) {}
    public function execute(Media $media, array $data, int $userId): Media {
        return $this->service->updateMetadata($media, $data, $userId);
    }
}
