<?php

namespace App\Domains\Core\Providers;

use App\Domains\Core\Contracts\MeetingProviderInterface;
use Illuminate\Support\Facades\Config;

class MeetingProviderFactory
{
    public static function make(?string $provider = null): MeetingProviderInterface
    {
        $provider = $provider ?? Config::get('liveclass.default_provider', 'zoom');

        return match ($provider) {
            'zoom', 'meet', 'teams', 'jitsi', 'custom' => new ManualUrlMeetingProvider($provider),
            default => new ManualUrlMeetingProvider('custom'),
        };
    }
}
