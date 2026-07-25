<?php

namespace App\Domains\Core\Providers;

class S3StorageProvider extends BaseStorageProvider
{
    protected string $disk = 's3';
    protected string $providerName = 'amazon_s3';
}
