<?php

namespace App\Domains\Core\Providers;

class VimeoProvider extends BaseExternalProvider
{
    protected string $providerName = 'vimeo';

    public function getUrl(string $path): string
    {
        return "https://vimeo.com/{$path}";
    }

    public function getStreamingUrl(string $pathOrId): string
    {
        return "https://player.vimeo.com/video/{$pathOrId}";
    }
}
