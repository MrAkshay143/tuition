<?php

namespace App\Domains\Core\Providers;

use App\Domains\Core\Contracts\MediaProviderInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

abstract class BaseStorageProvider implements MediaProviderInterface
{
    protected string $disk;
    protected string $providerName;

    public function upload(UploadedFile $file, string $directory = 'uploads/media'): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $filename = Str::random(40) . '.' . $extension;
        
        $path = $file->storeAs($directory, $filename, $this->disk);

        return [
            'path' => $path,
            'url' => $this->getUrl($path),
            'provider' => $this->providerName,
            'driver' => $this->disk,
        ];
    }

    public function delete(string $path): bool
    {
        return Storage::disk($this->disk)->delete($path);
    }

    public function getUrl(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }

    public function getStreamingUrl(string $pathOrId): string
    {
        return $this->getUrl($pathOrId);
    }

    public function getDuration(string $pathOrId): int
    {
        // Duration extraction is done via VideoProcessingService before upload, or via FFmpeg
        return 0;
    }

    public function put(string $path, string $contents): bool
    {
        return Storage::disk($this->disk)->put($path, $contents);
    }

    public function get(string $path): ?string
    {
        return Storage::disk($this->disk)->get($path);
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }

    public function temporaryUrl(string $path, \DateTimeInterface $expiration): string
    {
        return Storage::disk($this->disk)->temporaryUrl($path, $expiration);
    }

    public function path(string $path): string
    {
        return Storage::disk($this->disk)->path($path);
    }

    public function response(string $path)
    {
        return Storage::disk($this->disk)->response($path);
    }

    public function makeDirectory(string $path): bool
    {
        return Storage::disk($this->disk)->makeDirectory($path);
    }
}
