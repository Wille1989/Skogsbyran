<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Models\Property;
use App\Models\Document;
use App\Models\Image;
use Illuminate\Support\Collection;

/**
 * Build ready-to-use property payloads from Eloquent models.
 *
 */
class PropertyPresenter
{
    /**
     * Build the modern API representation for one property.
     *
     * @return array<string, mixed>
     */
    public function toApi(Property $property): array
    {
        $property->loadMissing(['areas', 'images', 'documents']);

        $area = $property->areas->first();

        return [
            'id' => $property->id,
            'title' => $property->title,
            'caption' => $property->caption,
            'price' => $property->price,
            'size' => $property->size,
            'boundaries' => $area ? [
                'id' => $area->id,
                'polygon' => $area->area_json,
            ] : null,
            'images' => $property->images
                ->map(fn (Image $image): array => $this->imageToApi($image))
                ->values()
                ->all(),
            'documents' => $this->documentsToApi($property),
        ];
    }

    /**
     * Build the legacy wrapper representation for one property.
     *
     * @return array<string, array<string, mixed>>
     */
    public function toLegacyWrapped(Property $property): array
    {
        return [
            'property' => $this->toLegacy($property),
        ];
    }

    /**
     * Build the legacy wrapper representation for a collection.
     *
     * @param  Collection<int, Property>  $properties
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function collectionToLegacyWrapped(Collection $properties): array
    {
        return [
            'properties' => $properties
                ->map(fn (Property $property): array => $this->toLegacy($property))
                ->values()
                ->all(),
        ];
    }

    /**
     * Build the lightweight list wrapper used by the property index.
     *
     * @param  Collection<int, Property>  $properties
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function collectionToLegacyListWrapped(Collection $properties): array
    {
        return [
            'properties' => $properties
                ->map(fn (Property $property): array => $this->toLegacyListItem($property))
                ->values()
                ->all(),
        ];
    }

    /**
     * Build the legacy representation for one property.
     *
     * @return array<string, mixed>
     */
    public function toLegacy(Property $property): array
    {
        $property->loadMissing(['areas', 'images', 'documents']);

        $area = $property->areas->first();

        return [
            'propertyID' => (string) $property->id,
            'title' => $property->title,
            'caption' => $property->caption,
            'price' => (string) ($property->price ?? ''),
            'size' => (string) ($property->size ?? ''),
            'boundaries' => $area ? [
                'boundariesID' => (string) $area->id,
                'propertyID' => (string) $property->id,
                'polygon' => $area->area_json,
                'marker' => [
                    'lat' => $area->marker_lat,
                    'lng' => $area->marker_lng,
                ],
            ] : null,
            'images' => $property->images
                ->map(fn (Image $image): array => $this->imageToLegacy($image))
                ->values()
                ->all(),
            'documents' => $this->documentsToLegacy($property),
        ];
    }

    /**
     * Build the API representation for one image.
     *
     * @return array<string, mixed>
     */
    public function imageToApi(Image $image): array
    {
        return [
            'uiId' => 'image-'.$image->id,
            'id' => $image->id,
            'imageId' => (string) $image->id,
            'property_id' => $image->property_id,
            'url' => $image->medium_url ?: $image->large_url ?: $image->original_url,
            'original_url' => $image->original_url,
            'thumb_url' => $image->thumb_url ?: $image->original_url,
            'medium_url' => $image->medium_url ?: $image->large_url ?: $image->original_url,
            'large_url' => $image->large_url ?: $image->original_url,
            'thumb_path' => $image->thumb_url ?: $image->original_url,
            'medium_path' => $image->medium_url ?: $image->large_url ?: $image->original_url,
            'large_path' => $image->large_url ?: $image->original_url,
            'position' => $image->position,
            'is_primary' => $image->is_primary,
            'isPrimary' => $image->is_primary,
            'createdAt' => $image->created_at?->toISOString(),
            'updatedAt' => $image->updated_at?->toISOString(),
            'attributes' => [
                'caption' => $image->caption ?? '',
                'alt' => $image->alt_text ?? '',
                'brightness' => $image->brightness ?? 1,
                'gamma' => $image->gamma ?? 1,
                'contrast' => $image->contrast ?? 1,
                'saturation' => $image->saturation ?? 1,
            ],
        ];
    }

    /**
     * Build the lightweight list representation for one property.
     *
     * @return array<string, mixed>
     */
    public function toLegacyListItem(Property $property): array
    {
        $property->loadMissing(['images', 'documents']);

        $images = $property->images->values();
        $primaryIndex = $images->search(
            fn (Image $image): bool => $image->is_primary
        );

        if ($primaryIndex === false) {
            $primaryIndex = 0;
        }

        $listImages = $images->slice($primaryIndex, 3)->values();

        return [
            'propertyID' => (string) $property->id,
            'title' => $property->title,
            'caption' => $property->caption,
            'price' => (string) ($property->price ?? ''),
            'size' => (string) ($property->size ?? ''),
            'boundaries' => null,
            'images' => $listImages
                ->map(fn (Image $image): array => $this->imageToLegacy($image))
                ->all(),
            'documents' => $this->documentsToLegacy($property),
        ];
    }

    /**
     * Build the API representation for the typed property documents.
     *
     * @return array<string, array<string, mixed>|null>
     */
    private function documentsToApi(Property $property): array
    {
        $property->loadMissing('documents');

        return $this->buildDocumentSlots($property->documents, fn (Document $document): array => [
            'id' => $document->id,
            'type' => $document->type,
            'title' => $document->title,
            'url' => $document->url,
            'original_name' => $document->original_name,
            'mime_type' => $document->mime_type,
            'size_bytes' => $document->size_bytes,
            'created_at' => $document->created_at?->toISOString(),
            'updated_at' => $document->updated_at?->toISOString(),
        ]);
    }

    /**
     * Build the legacy representation for the typed property documents.
     *
     * @return array<string, array<string, mixed>|null>
     */
    private function documentsToLegacy(Property $property): array
    {
        $property->loadMissing('documents');

        return $this->buildDocumentSlots($property->documents, fn (Document $document): array => [
            'documentID' => (string) $document->id,
            'propertyID' => (string) $document->property_id,
            'type' => $document->type,
            'title' => $document->title,
            'url' => $document->url,
            'originalName' => $document->original_name,
            'mimeType' => $document->mime_type,
            'sizeBytes' => $document->size_bytes,
        ]);
    }

    /**
     * @param  Collection<int, Document>  $documents
     * @param  callable(Document): array<string, mixed>  $mapper
     * @return array<string, array<string, mixed>|null>
     */
    private function buildDocumentSlots(Collection $documents, callable $mapper): array
    {
        $slots = [
            Document::TYPE_BID_FORM => null,
            Document::TYPE_PROSPECT => null,
            Document::TYPE_PROPERTY_MAP => null,
        ];

        foreach ($documents as $document) {
            if (! array_key_exists($document->type, $slots)) {
                continue;
            }

            $slots[$document->type] = $mapper($document);
        }

        return $slots;
    }

    /**
     * Build the legacy representation for one image.
     *
     * @return array<string, mixed>
     */
    public function imageToLegacy(Image $image): array
    {
        return [
            'imageID' => (string) $image->id,
            'propertyID' => (string) $image->property_id,
            'url' => $image->medium_url ?: $image->large_url ?: $image->original_url,
            'thumbUrl' => $image->thumb_url ?: $image->original_url,
            'mediumUrl' => $image->medium_url ?: $image->large_url ?: $image->original_url,
            'largeUrl' => $image->large_url ?: $image->original_url,
            'originalUrl' => $image->original_url,
            'position' => $image->position,
            'isPrimary' => $image->is_primary,
            'imageAttributes' => [
                'imageAttributesID' => (string) $image->id,
                'imageID' => (string) $image->id,
                'caption' => $image->caption ?? '',
                'alt' => $image->alt_text ?? '',
                'brightness' => $image->brightness ?? 1,
                'gamma' => $image->gamma ?? 1,
                'contrast' => $image->contrast ?? 1,
                'saturation' => $image->saturation ?? 1,
            ],
        ];
    }
}
