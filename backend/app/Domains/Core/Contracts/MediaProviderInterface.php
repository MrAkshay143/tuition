<?php

namespace App\Domains\Core\Contracts;

use Illuminate\Http\UploadedFile;

interface MediaProviderInterface
{
    /**
     * Upload a file to the provider's storage.
     * Returns an array with ['path' => string, 'url' => string, 'provider' => string, 'driver' => string]
     */
    public function upload(UploadedFile $file, string $directory = 'uploads/media'): array;

    /**
     * Delete a file from the provider's storage.
     */
    public function delete(string $path): bool;

    /**
     * Get the public URL for a given path.
     */
    public function getUrl(string $path): string;

    /**
     * Get a streaming URL (e.g. HLS or direct video link).
     */
    public function getStreamingUrl(string $pathOrId): string;

    /**
     * Get the duration of a video or audio file.
     */
    public function getDuration(string $pathOrId): int;

    /**
     * Put contents into a file.
     */
    public function put(string $path, string $contents): bool;

    /**
     * Get contents of a file.
     */
    public function get(string $path): ?string;

    /**
     * Check if a file exists.
     */
    public function exists(string $path): bool;

    /**
     * Get temporary URL.
     */
    public function temporaryUrl(string $path, \DateTimeInterface $expiration): string;

    /**
     * Get local file path (if applicable).
     */
    public function path(string $path): string;

    /**
     * Return a download/stream response for the file.
     */
    public function response(string $path);

    /**
     * Make a directory.
     */
    public function makeDirectory(string $path): bool;
}
