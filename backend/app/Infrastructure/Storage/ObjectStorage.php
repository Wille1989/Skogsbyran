<?php

declare(strict_types=1);

namespace App\Infrastructure\Storage;

use DateTimeInterface;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Filesystem\FilesystemManager;

final class ObjectStorage
{
    public const DOCUMENTS_DISK = 'documents';
    public const IMAGES_DISK = 'images';

    public function __construct(
        private readonly FilesystemManager $filesystems,
    ) {
    }

    public function putContents(string $disk, string $storageKey, string $contents): void
    {
        $this->disk($disk)->put($storageKey, $contents);
    }

    /**
     * @param resource $stream
     */
    public function putStream(string $disk, string $storageKey, $stream): void
    {
        $this->disk($disk)->put($storageKey, $stream);
    }

    /**
     * @param  string|array<int, string>  $storageKeys
     */
    public function delete(string $disk, string|array $storageKeys): void
    {
        if (! $this->disk($disk)->delete($storageKeys)) {
            throw new \RuntimeException('Storage deletion failed.');
        }
    }

    public function exists(string $disk, string $storageKey): bool
    {
        return $this->disk($disk)->exists($storageKey);
    }

    public function get(string $disk, string $storageKey): string
    {
        return $this->disk($disk)->get($storageKey);
    }

    public function temporaryUrl(string $disk, string $storageKey, DateTimeInterface $expiresAt): string
    {
        return $this->disk($disk)->temporaryUrl($storageKey, $expiresAt);
    }

    public function disk(string $disk): FilesystemAdapter
    {
        return $this->filesystems->disk($disk);
    }
}
