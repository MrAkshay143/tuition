<?php

namespace App\Domains\Media\Services;

use App\Domains\Media\Contracts\StorageProvider;
use App\Domains\Media\Models\Media;
use Illuminate\Http\UploadedFile;

class UploadService
{
    protected StorageProvider $storage;

    public function __construct(StorageProvider $storage)
    {
        $this->storage = $storage;
    }

    /**
     * Upload an asset and register it in the centralized Media Library.
     */
    public function handle(UploadedFile $file, string $directory = 'materials'): Media
    {
        // Store path configuration
        $path = $this->storage->upload($file, $directory);

        // Create Media library record
        return Media::create([
            'filename'    => $file->getClientOriginalName(),
            'path'        => $path,
            'mime_type'   => $file->getClientMimeType(),
            'size_bytes'  => $file->getSize(),
            'uploaded_by' => auth()->id() ?: 1, // Fallback to user ID 1 in seeding/tests
        ]);
    }
}
