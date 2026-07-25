<?php

namespace App\Domains\Core\Providers;

class BunnyStorageProvider extends BaseStorageProvider
{
    protected string $disk = 'bunny';
    protected string $providerName = 'bunny_storage';
}
