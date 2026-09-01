<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Property;
use App\Models\PropertyDocument;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

final class PropertyDocumentService
{
    public function __construct(
        private readonly DocumentStorageService $storageService
    ) {
    }


    public function store(Property $property, array $validated): PropertyDocument {
        $file = $validated['file'];
        $type = $validated['type'];

        $upload = $this->storageService->upload(
            $file,
            (int) $property->id,
            $type
        );

        try {
            return DB::transaction(
                function () use (
                    $property,
                    $file,
                    $type,
                    $upload
                ): PropertyDocument {
                    return PropertyDocument::query()->create([
                        'property_id' => $property->id,
                        'type' => $type,
                        'title' => $this->resolveTitle($type),
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType() ?: 'application/pdf',
                        'size_bytes' => $file->getSize() ?: 0,
                        'url' => $upload['url'],
                        'storage_key' => $upload['storage_key'],
                    ]);
                }
            );
        } catch (Throwable $exception) {
            $this->deleteStorageSafely(
                $upload['storage_key']
            );

            throw $exception;
        }
    }

    public function update(Property $property, PropertyDocument $document, array $validated): PropertyDocument {
        $this->ensureDocumentBelongsToProperty(
            $property,
            $document
        );

        $file = $validated['file'];

        $previousStorageKey = $document->storage_key;

        $upload = $this->storageService->upload(
            $file,
            (int) $property->id,
            $document->type
        );

        try {
            DB::transaction(
                function () use (
                    $document,
                    $file,
                    $upload
                ): void {
                    $document->fill([
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType() ?: 'application/pdf',
                        'size_bytes' => $file->getSize() ?: 0,
                        'url' => $upload['url'],
                        'storage_key' => $upload['storage_key'],
                    ]);

                    $document->save();
                }
            );
        } catch (Throwable $exception) {
            $this->deleteStorageSafely(
                $upload['storage_key']
            );

            throw $exception;
        }

        if (
            is_string($previousStorageKey)
            && $previousStorageKey !== ''
            && $previousStorageKey !== $upload['storage_key']
        ) {
            $this->deleteStorageSafely(
                $previousStorageKey
            );
        }

        return $document->refresh();
    }

    public function delete(Property $property, PropertyDocument $document): void {
        $this->ensureDocumentBelongsToProperty(
            $property,
            $document
        );

        $storageKey = $document->storage_key;

        DB::transaction(
            static function () use ($document): void {
                $document->delete();
            }
        );

        if (
            is_string($storageKey)
            && $storageKey !== ''
        ) {
            $this->deleteStorageSafely(
                $storageKey
            );
        }
    }

    private function ensureDocumentBelongsToProperty(Property $property, PropertyDocument $document): void {
        if (
            (int) $document->property_id
            === (int) $property->id
        ) {
            return;
        }

        throw (new ModelNotFoundException())
            ->setModel(
                PropertyDocument::class,
                [$document->id]
            );
    }

    private function deleteStorageSafely(string $storageKey): void {
        try {
            $this->storageService->delete(
                $storageKey
            );
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    private function resolveTitle(string $type): string {
        return match ($type) {
            PropertyDocument::TYPE_BID_FORM => 'Anbudsblankett',
            PropertyDocument::TYPE_PROSPECT => 'Prospekt',
            PropertyDocument::TYPE_PROPERTY_MAP => 'Fastighetskarta',
            default => 'Dokument',
        };
    }
}