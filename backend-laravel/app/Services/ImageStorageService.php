<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class ImageStorageService
{
    public function __construct(
        private readonly ImageVariantService $imageVariantService,
        private readonly SupabaseStorageService $supabaseStorageService,
    ) {
    }

    public function upload(UploadedFile $file, int $propertyId): array {
        $variantFiles = $this->imageVariantService->process($file);

        try {
            if ($this->shouldUseLocalStorage()) {
                return $this->storeLocally(
                    $propertyId,
                    $variantFiles
                );
            }

            return $this->storeInSupabase(
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
        if ($this->shouldUseLocalStorage()) {
            Storage::disk('public')->delete(
                array_values($storageKeys)
            );

            return;
        }

        foreach ($storageKeys as $storageKey) {
            $this->supabaseStorageService->delete(
                $storageKey
            );
        }
    }

    private function storeInSupabase(int $propertyId, array $variantFiles): array {
        $baseName = uniqid($propertyId . '_', true);

        $storageKeys = [];
        $urls = [];

        try {
            foreach ($variantFiles as $variant => $path) {
                $storageKey = sprintf(
                    'properties/%d/images/%s_%s.webp',
                    $propertyId,
                    $baseName,
                    $variant
                );

                $binary = file_get_contents($path);

                if ($binary === false) {
                    throw new \RuntimeException(
                        'Failed to read image variant.'
                    );
                }

                $urls[$variant] =
                    $this->supabaseStorageService->upload(
                        storageKey: $storageKey,
                        contents: $binary,
                        contentType: 'image/webp',
                    );

                $storageKeys[$variant] = $storageKey;
            }
        } catch (Throwable $exception) {
            foreach ($storageKeys as $storageKey) {
                try {
                    $this->supabaseStorageService->delete(
                        $storageKey
                    );
                } catch (Throwable) {
                    // Cleanup failure must not hide original exception.
                }
            }

            throw $exception;
        }

        return $this->buildResult(
            $urls,
            $storageKeys
        );
    }

    private function storeLocally(int $propertyId, array $variantFiles): array {
        $baseName = uniqid($propertyId . '_', true);

        $storageKeys = [];
        $urls = [];

        foreach ($variantFiles as $variant => $path) {
            $storageKey = sprintf(
                'properties/%d/images/%s_%s.webp',
                $propertyId,
                $baseName,
                $variant
            );

            $stream = fopen($path, 'rb');

            if ($stream === false) {
                throw new \RuntimeException(
                    'Failed to open image variant.'
                );
            }

            try {
                Storage::disk('public')->put(
                    $storageKey,
                    $stream
                );
            } finally {
                fclose($stream);
            }

            $storageKeys[$variant] = $storageKey;
            $urls[$variant] = Storage::disk('public')->url(
                $storageKey
            );
        }

        return $this->buildResult(
            $urls,
            $storageKeys
        );
    }

    private function buildResult(array $urls, array $storageKeys): array {
        return [
            'thumb_url' => $urls['thumb'],
            'medium_url' => $urls['medium'],
            'large_url' => $urls['large'],

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

    private function shouldUseLocalStorage(): bool
    {
        return app()->environment('testing')
            || !$this->supabaseStorageService->isConfigured();
    }
}