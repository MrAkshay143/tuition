<?php

namespace App\Domains\Core\Contracts;

interface StorageProviderInterface
{
    public function upload($file, string $path): string;
    public function delete(string $path): bool;
    public function exists(string $path): bool;
}
