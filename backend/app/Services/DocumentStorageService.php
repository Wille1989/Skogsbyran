<?php

declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\Storage\ObjectStorage;
use App\Modules\Document\Enums\DocumentVariantName;
use Illuminate\Http\UploadedFile;
use RuntimeException;

final class DocumentStorageService
{
    public function __construct(
        private readonly ObjectStorage $objectStorage
    ) {
    }

    public function upload(UploadedFile $file, int $propertyId, ?string $type): array {
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
            ObjectStorage::DOCUMENTS_DISK,
            $storageKey,
            $contents
        );

        return [
            'variants' => [
                DocumentVariantName::Original->value => [
                    'storage_key' => $storageKey,
                    'mime_type' => $contentType,
                    'file_size' => $file->getSize() ?: null,
                ],
            ],
        ];
    }

    public function delete(string $storageKey): void {
        $this->objectStorage->delete(
            ObjectStorage::DOCUMENTS_DISK,
            $storageKey
        );
    }

    private function createStorageKey(UploadedFile $file, int $propertyId, ?string $type): string {
        $extension = strtolower(
            $file->getClientOriginalExtension()
            ?: 'pdf'
        );

        $fileName = uniqid(
            $propertyId . '_',
            true
        );

        $prefix = config('filesystems.object_storage_prefix');

        if (!is_string($prefix)) {
            throw new \RuntimeException('Invalid object storage prefix.');
        }

        return sprintf(
            '%s/properties/%d/documents/%s/%s.%s',
            $prefix,
            $propertyId,
            $type ?: 'general',
            $fileName,
            $extension
        );
    }

}
