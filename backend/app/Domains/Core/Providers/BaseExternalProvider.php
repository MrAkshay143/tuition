<?php

namespace App\Domains\Core\Providers;

use App\Domains\Core\Contracts\MediaProviderInterface;
use Illuminate\Http\UploadedFile;
use RuntimeException;

abstract class BaseExternalProvider implements MediaProviderInterface
{
    protected string $providerName;

    public function upload(UploadedFile $file, string $directory = 'uploads/media'): array
    {
        throw new RuntimeException("Upload is not supported for external provider: {$this->providerName}");
    }

    public function delete(string $path): bool
    {
        // External providers generally don't delete files from their platform via this app, or it's just a reference
        return true;
    }

    public function getUrl(string $path): string
    {
        return $path;
    }

    public function getStreamingUrl(string $pathOrId): string
    {
        return $this->getUrl($pathOrId);
    }

    public function getDuration(string $pathOrId): int
    {
        // Duration is typically synced via metadata extraction at import
        return 0;
    }
}
