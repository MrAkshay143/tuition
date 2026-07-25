<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Services\MediaService;
use App\Domains\Media\Models\Media;
class ImportYoutubeAction {
    public function __construct(protected MediaService $service) {}
    public function execute(array $data, int $userId): Media {
        return $this->service->importYoutube($data, $userId);
    }
}
