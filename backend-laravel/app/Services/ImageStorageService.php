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
        $urls = [];

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
                $urls[$variant] = $this->objectStorage->url(
                    $storageKey,
                );
            }
        } catch (Throwable $exception) {
            $this->deleteUploadedVariantsSafely($storageKeys);

            throw $exception;
        }

        return $this->buildResult(
            $urls,
            $storageKeys
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

    private function buildResult(array $urls, array $storageKeys): array {
        return [
            'original_url' => $urls['large'],
            'thumb_url' => $urls['thumb'],
            'medium_url' => $urls['medium'],
            'large_url' => $urls['large'],
            'storage_key' => json_encode(
                [
                    'thumb' => $storageKeys['thumb'],
                    'medium' => $storageKeys['medium'],
                    'large' => $storageKeys['large'],
                ],
                JSON_THROW_ON_ERROR
            ),

            'storage_keys' => [
                'thumb' => $storageKeys['thumb'],
                'medium' => $storageKeys['medium'],
                'large' => $storageKeys['large'],
            ],
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
