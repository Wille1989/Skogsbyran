<?php

declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\Storage\ObjectStorage;
use Illuminate\Http\UploadedFile;
use RuntimeException;

final class DocumentStorageService
{
    public function __construct(
        private readonly ObjectStorage $objectStorage
    ) {
    }

    public function upload(UploadedFile $file, int $propertyId, string $type): array {
        $storageKey = $this->createStorageKey(
            $file,
            $propertyId,
            $type
        );

        $path = $file->getRealPath();

        if (
            !is_string($path)
            || $path === ''
        ) {
            throw new RuntimeException(
                'Document path is not readable.'
            );
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException(
                'Failed to read document.'
            );
        }

        $contentType =
            $file->getMimeType()
            ?: 'application/pdf';

        $this->objectStorage->putContents(
            $storageKey,
            $contents
        );

        return [
            'url' => $this->objectStorage->url($storageKey),
            'storage_key' => $storageKey,
            'mime_type' => $contentType,
        ];
    }

    public function delete(string $storageKey): void {
        $this->objectStorage->delete(
            $storageKey
        );
    }

    private function createStorageKey(UploadedFile $file, int $propertyId, string $type): string {
        $extension = strtolower(
            $file->getClientOriginalExtension()
            ?: 'pdf'
        );

        $fileName = uniqid(
            $propertyId . '_',
            true
        );

        return sprintf(
            'properties/%d/documents/%s/%s.%s',
            $propertyId,
            $type,
            $fileName,
            $extension
        );
    }

}
