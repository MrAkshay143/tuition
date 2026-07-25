<?php

namespace App\Domains\Core\Providers;

class R2StorageProvider extends BaseStorageProvider
{
    protected string $disk = 'r2';
    protected string $providerName = 'cloudflare_r2';
}
