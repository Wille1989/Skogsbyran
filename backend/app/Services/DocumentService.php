<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Document\Enums\DocumentVariantName;
use App\Modules\Document\Models\Document;
use App\Modules\Property\Models\Property;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

final class DocumentService
{
    public function __construct(
        private readonly DocumentStorageService $storageService
    ) {
    }


    public function store(Property $property, array $validated): Document {
        $file = $validated['file'];
        $type = $validated['type'] ?? null;
        $title = $this->resolveTitle($type, $validated['title'] ?? null, $file);

        $upload = $this->storageService->upload(
            $file,
            (int) $property->id,
            $type
        );

        $previousDocument = $type !== null
            ? $this->documentForLegacyType($property, $type)
            : null;

        try {
            $document = DB::transaction(
                function () use (
                    $property,
                    $file,
                    $type,
                    $title,
                    $upload,
                    $previousDocument
                ): Document {
                    if ($previousDocument instanceof Document) {
                        $property->documents()->detach($previousDocument->id);
                    }

                    $document = Document::query()->create([
                        'name' => $title,
                        'original_filename' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType() ?: 'application/pdf',
                        'page_count' => null,
                    ]);

                    foreach ($upload['variants'] as $variant => $variantData) {
                        $document->variants()->create([
                            'variant' => $variant,
                            'storage_key' => $variantData['storage_key'],
                            'mime_type' => $variantData['mime_type'],
                            'file_size' => $variantData['file_size'],
                        ]);
                    }

                    $property->documents()->attach($document->id, [
                        'type' => $type,
                        'title' => $title,
                        'sort_order' => $this->sortOrder($property, $type),
                    ]);

                    return $this->freshPropertyDocument($property, $document);
                }
            );
        } catch (Throwable $exception) {
            $this->deleteStorageSafely(
                $this->uploadedStorageKeys($upload)
            );

            throw $exception;
        }

        if ($previousDocument instanceof Document) {
            $this->deleteDocumentIfUnused($previousDocument);
        }

        return $document;
    }

    public function update(Property $property, Document $document, array $validated): Document {
        $this->ensureDocumentBelongsToProperty(
            $property,
            $document
        );

        $file = $validated['file'];
        $propertyDocument = $this->freshPropertyDocument($property, $document);
        $type = $validated['type'] ?? $this->legacyType($propertyDocument);
        $title = $this->resolveTitle($type, $validated['title'] ?? null, $file);

        $upload = $this->storageService->upload(
            $file,
            (int) $property->id,
            $type
        );

        try {
            $replacement = DB::transaction(
                function () use (
                    $property,
                    $document,
                    $file,
                    $type,
                    $title,
                    $upload
                ): Document {
                    $property->documents()->detach($document->id);

                    $replacement = Document::query()->create([
                        'name' => $title,
                        'original_filename' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType() ?: 'application/pdf',
                        'page_count' => null,
                    ]);

                    foreach ($upload['variants'] as $variant => $variantData) {
                        $replacement->variants()->create([
                            'variant' => $variant,
                            'storage_key' => $variantData['storage_key'],
                            'mime_type' => $variantData['mime_type'],
                            'file_size' => $variantData['file_size'],
                        ]);
                    }

                    $property->documents()->attach($replacement->id, [
                        'type' => $type,
                        'title' => $title,
                        'sort_order' => $this->sortOrder($property, $type),
                    ]);

                    return $this->freshPropertyDocument($property, $replacement);
                }
            );
        } catch (Throwable $exception) {
            $this->deleteStorageSafely(
                $this->uploadedStorageKeys($upload)
            );

            throw $exception;
        }

        $this->deleteDocumentIfUnused($document);

        return $replacement;
    }

    public function delete(Property $property, Document $document): void {
        $this->ensureDocumentBelongsToProperty(
            $property,
            $document
        );

        DB::transaction(
            static function () use ($property, $document): void {
                $property->documents()->detach($document->id);
            }
        );

        $this->deleteDocumentIfUnused($document);
    }

    private function ensureDocumentBelongsToProperty(Property $property, Document $document): void {
        if ($document->properties()->whereKey($property->id)->exists()) {
            return;
        }

        throw (new ModelNotFoundException())
            ->setModel(
                Document::class,
                [$document->id]
            );
    }

    /**
     * @param  array<int, string>  $storageKeys
     */
    private function deleteStorageSafely(array $storageKeys): void {
        foreach (array_unique($storageKeys) as $storageKey) {
            try {
                $this->storageService->delete(
                    $storageKey
                );
            } catch (Throwable $exception) {
                report($exception);
            }
        }
    }

    private function resolveTitle(?string $type, mixed $title, UploadedFile $file): string {
        if (is_string($title) && trim($title) !== '') {
            return trim($title);
        }

        return match ($type) {
            Document::TYPE_BID_FORM => 'Anbudsblankett',
            Document::TYPE_PROSPECT => 'Prospekt',
            Document::TYPE_PROPERTY_MAP => 'Fastighetskarta',
            default => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) ?: 'Dokument',
        };
    }

    private function documentForLegacyType(Property $property, string $type): ?Document
    {
        $document = $property->documents()
            ->wherePivot('type', $type)
            ->with('variants')
            ->first();

        return $document instanceof Document
            ? $document
            : null;
    }

    private function freshPropertyDocument(Property $property, Document $document): Document
    {
        $fresh = $property->documents()
            ->whereKey($document->id)
            ->with('variants')
            ->firstOrFail();

        if (!$fresh instanceof Document) {
            throw (new ModelNotFoundException())
                ->setModel(Document::class, [$document->id]);
        }

        return $fresh;
    }

    private function deleteDocumentIfUnused(Document $document): void
    {
        $document->loadMissing('variants');

        if ($document->properties()->exists()) {
            return;
        }

        $storageKeys = $document->variants
            ->pluck('storage_key')
            ->filter(static fn (mixed $value): bool =>
                is_string($value) && $value !== ''
            )
            ->values()
            ->all();

        $document->delete();

        $this->deleteStorageSafely($storageKeys);
    }

    /**
     * @return array<int, string>
     */
    private function uploadedStorageKeys(array $upload): array
    {
        return array_values(array_filter(
            array_map(
                static fn (array $variant): mixed => $variant['storage_key'] ?? null,
                $upload['variants'] ?? []
            ),
            static fn (mixed $value): bool => is_string($value) && $value !== ''
        ));
    }

    private function legacyType(Document $document): ?string
    {
        $type = $document->pivot?->type ?? null;

        return is_string($type) && $type !== ''
            ? $type
            : null;
    }

    private function sortOrder(Property $property, ?string $type): int
    {
        if ($type !== null) {
            return $this->legacySortOrder($type);
        }

        $maxSortOrder = $property->documents()->max('property_documents.sort_order');

        return $maxSortOrder === null
            ? 100
            : ((int) $maxSortOrder) + 10;
    }

    private function legacySortOrder(string $type): int
    {
        return match ($type) {
            Document::TYPE_PROSPECT => 10,
            Document::TYPE_BID_FORM => 20,
            Document::TYPE_PROPERTY_MAP => 30,
            default => 100,
        };
    }
}
