<?php

declare(strict_types=1);

namespace App\Infrastructure\Storage;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Filesystem\FilesystemManager;

final class ObjectStorage
{
    public function __construct(
        private readonly FilesystemManager $filesystems,
    ) {
    }

    public function putContents(string $storageKey, string $contents): void
    {
        $this->disk()->put($storageKey, $contents);
    }

    /**
     * @param resource $stream
     */
    public function putStream(string $storageKey, $stream): void
    {
        $this->disk()->put($storageKey, $stream);
    }

    /**
     * @param  string|array<int, string>  $storageKeys
     */
    public function delete(string|array $storageKeys): void
    {
        $this->disk()->delete($storageKeys);
    }

    public function url(string $storageKey): string
    {
        return $this->disk()->url($storageKey);
    }

    private function disk(): FilesystemAdapter
    {
        return $this->filesystems->disk(
            (string) config('filesystems.object_storage_disk', 'public')
        );
    }
}
