<?php

namespace App\Domains\Core\Providers;

use App\Domains\Core\Contracts\MediaProviderInterface;
use App\Domains\Core\Enums\MediaProvider;
use Illuminate\Support\Facades\Config;

class MediaProviderFactory
{
    public static function make(?string $provider = null): MediaProviderInterface
    {
        $provider = $provider ?? Config::get('media.default_provider', 'local');

        return match ($provider) {
            MediaProvider::AMAZON_S3->value => new S3StorageProvider(),
            MediaProvider::CLOUDFLARE_R2->value => new R2StorageProvider(),
            'bunny_storage' => new BunnyStorageProvider(),
            'youtube' => new YouTubeProvider(),
            'vimeo' => new VimeoProvider(),
            'external' => new ExternalUrlProvider(),
            MediaProvider::LOCAL->value => new LocalStorageProvider(),
            default => new LocalStorageProvider(),
        };
    }
}
