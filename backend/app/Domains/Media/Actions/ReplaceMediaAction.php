<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class ReplaceMediaAction {
    public function __construct(protected MediaService $service) {}
    public function execute(Media $media, $file, int $userId): Media {
        return $this->service->replaceFile($media, $file, $userId);
    }
}
