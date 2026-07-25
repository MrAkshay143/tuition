<?php

namespace App\Domains\Media\Services;

use App\Domains\Media\Contracts\StorageProvider;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LocalStorageProvider implements StorageProvider
{
    /**
     * Store an uploaded file.
     */
    public function upload(UploadedFile $file, string $path): string
    {
        return Storage::disk('public')->putFile($path, $file);
    }

    /**
     * Delete a file by path.
     */
    public function delete(string $path): bool
    {
        return Storage::disk('public')->delete($path);
    }

    /**
     * Check if a file exists.
     */
    public function exists(string $path): bool
    {
        return Storage::disk('public')->exists($path);
    }

    /**
     * Get the public URL of a file.
     */
    public function url(string $path): string
    {
        return asset('storage/' . $path);
    }
}
