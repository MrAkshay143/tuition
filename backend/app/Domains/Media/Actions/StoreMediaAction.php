<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class StoreMediaAction {
    public function __construct(protected MediaService $service) {}
    public function execute($file, array $data, int $userId): Media {
        return $this->service->uploadFile($file, $data, $userId);
    }
}
