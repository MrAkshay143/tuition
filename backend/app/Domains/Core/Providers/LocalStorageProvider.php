<?php

namespace App\Domains\Core\Providers;

class LocalStorageProvider extends BaseStorageProvider
{
    protected string $disk = 'public';
    protected string $providerName = 'local';
}
