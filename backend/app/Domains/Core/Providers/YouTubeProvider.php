<?php

namespace App\Domains\Core\Providers;

class YouTubeProvider extends BaseExternalProvider
{
    protected string $providerName = 'youtube';

    public function getUrl(string $path): string
    {
        return "https://www.youtube.com/watch?v={$path}";
    }

    public function getStreamingUrl(string $pathOrId): string
    {
        return "https://www.youtube.com/embed/{$pathOrId}";
    }
}
