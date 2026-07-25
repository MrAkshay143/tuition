<?php

namespace App\Domains\Media\Contracts;

use Illuminate\Http\UploadedFile;

interface StorageProvider
{
    /**
     * Store an uploaded file.
     */
    public function upload(UploadedFile $file, string $path): string;

    /**
     * Delete a file by path.
     */
    public function delete(string $path): bool;

    /**
     * Check if a file exists.
     */
    public function exists(string $path): bool;

    /**
     * Get the public URL of a file.
     */
    public function url(string $path): string;
}
