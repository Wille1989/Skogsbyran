<?php

declare(strict_types=1);

namespace App\Services;

use App\Infrastructure\Storage\ObjectStorage;
use Illuminate\Http\UploadedFile;
use Throwable;

final class ImageStorageService
{
    public function __construct(
        private readonly ImageVariantService $imageVariantService,
        private readonly ObjectStorage $objectStorage,
    ) {
    }

    public function upload(UploadedFile $file, int $propertyId): array {
        $variantFiles = $this->imageVariantService->process($file);

        try {
            return $this->store(
                $propertyId,
                $variantFiles
            );
        } finally {
            $this->deleteTemporaryFiles(
                $variantFiles
            );
        }
    }

    public function delete(array $storageKeys): void
    {
        $this->objectStorage->delete(
            array_values($storageKeys)
        );
    }

    private function store(int $propertyId, array $variantFiles): array {
        $baseName = uniqid($propertyId . '_', true);

        $storageKeys = [];

        try {
            foreach ($variantFiles as $variant => $path) {
                $storageKey = $this->createStorageKey(
                    $propertyId,
                    $baseName,
                    (string) $variant
                );

                $stream = fopen($path, 'rb');

                if ($stream === false) {
                    throw new \RuntimeException(
                        'Failed to open image variant.'
                    );
                }

                try {
                    $this->objectStorage->putStream(
                        $storageKey,
                        $stream
                    );
                } finally {
                    fclose($stream);
                }

                $storageKeys[$variant] = $storageKey;
            }
        } catch (Throwable $exception) {
            $this->deleteUploadedVariantsSafely($storageKeys);

            throw $exception;
        }

        return $this->buildResult(
            $storageKeys,
            $variantFiles
        );
    }

    private function createStorageKey(
        int $propertyId,
        string $baseName,
        string $variant
    ): string {
        return sprintf(
            'properties/%d/images/%s_%s.webp',
            $propertyId,
            $baseName,
            $variant
        );
    }

    private function buildResult(array $storageKeys, array $variantFiles): array {
        return [
            'variants' => [
                'thumb' => $this->variantPayload(
                    $storageKeys['thumb'],
                    $variantFiles['thumb']
                ),
                'medium' => $this->variantPayload(
                    $storageKeys['medium'],
                    $variantFiles['medium']
                ),
                'large' => $this->variantPayload(
                    $storageKeys['large'],
                    $variantFiles['large']
                ),
            ],
        ];
    }

    /**
     * @return array{storage_key: string, width: int|null, height: int|null, file_size: int|null, mime_type: string}
     */
    private function variantPayload(string $storageKey, string $path): array
    {
        $size = getimagesize($path);

        return [
            'storage_key' => $storageKey,
            'width' => is_array($size) ? $size[0] : null,
            'height' => is_array($size) ? $size[1] : null,
            'file_size' => is_file($path) ? filesize($path) ?: null : null,
            'mime_type' => 'image/webp',
        ];
    }

    private function deleteTemporaryFiles(array $variantFiles): void {
        foreach ($variantFiles as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }

    private function deleteUploadedVariantsSafely(array $storageKeys): void
    {
        foreach ($storageKeys as $storageKey) {
            try {
                $this->objectStorage->delete((string) $storageKey);
            } catch (Throwable) {
                // Cleanup failure must not hide original exception.
            }
        }
    }
}
