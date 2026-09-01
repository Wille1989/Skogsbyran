<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class DocumentStorageService
{
    public function __construct(
        private readonly SupabaseStorageService $supabaseStorageService
    ) {
    }

    public function upload(UploadedFile $file, int $propertyId, string $type): array {
        if ($this->shouldUseLocalStorage()) {
            return $this->storeLocally(
                $file,
                $propertyId,
                $type
            );
        }

        return $this->storeInSupabase(
            $file,
            $propertyId,
            $type
        );
    }

    public function delete(string $storageKey): void {
        if ($this->shouldUseLocalStorage()) {
            Storage::disk('public')->delete(
                $storageKey
            );

            return;
        }

        $this->supabaseStorageService->delete(
            $storageKey
        );
    }

    private function storeInSupabase(UploadedFile $file, int $propertyId, string $type): array {
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

        $url = $this->supabaseStorageService->upload(
            storageKey: $storageKey,
            contents: $contents,
            contentType: $contentType,
        );

        return [
            'url' => $url,
            'storage_key' => $storageKey,
        ];
    }

    private function storeLocally(UploadedFile $file, int $propertyId, string $type): array {
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

        $stream = fopen(
            $path,
            'rb'
        );

        if ($stream === false) {
            throw new RuntimeException(
                'Failed to open document.'
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

        return [
            'url' => Storage::disk('public')->url(
                $storageKey
            ),

            'storage_key' => $storageKey,
        ];
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

    private function shouldUseLocalStorage(): bool
    {
        return app()->environment('testing')
            || !$this->supabaseStorageService->isConfigured();
    }
}