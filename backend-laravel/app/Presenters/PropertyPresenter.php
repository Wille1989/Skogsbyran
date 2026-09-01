<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Models\Property;
use App\Models\PropertyDocument;
use App\Models\PropertyImage;
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
        $property->loadMissing(['area', 'images.metadata', 'documents']);

        return [
            'id' => $property->id,
            'title' => $property->title,
            'caption' => $property->caption,
            'price' => $property->price,
            'size' => $property->size,
            'boundaries' => $property->area ? [
                'id' => $property->area->id,
                'polygon' => $property->area->area_json,
            ] : null,
            'images' => $property->images
                ->map(fn (PropertyImage $image): array => $this->imageToApi($image))
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
        $property->loadMissing(['area', 'images.metadata', 'documents']);

        return [
            'propertyID' => (string) $property->id,
            'title' => $property->title,
            'caption' => $property->caption,
            'price' => (string) ($property->price ?? ''),
            'size' => (string) ($property->size ?? ''),
            'boundaries' => $property->area ? [
                'boundariesID' => (string) $property->area->id,
                'propertyID' => (string) $property->id,
                'polygon' => $property->area->area_json,
                'marker' => [
                    'lat' => $property->area->marker_lat,
                    'lng' => $property->area->marker_lng,
                ],
            ] : null,
            'images' => $property->images
                ->map(fn (PropertyImage $image): array => $this->imageToLegacy($image))
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
    public function imageToApi(PropertyImage $image): array
    {
        $image->loadMissing('metadata');

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
                'caption' => $image->metadata?->caption ?? '',
                'alt' => $image->metadata?->alt ?? '',
                'brightness' => $image->metadata?->brightness ?? 1,
                'gamma' => $image->metadata?->gamma ?? 1,
                'contrast' => $image->metadata?->contrast ?? 1,
                'saturation' => $image->metadata?->saturation ?? 1,
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
        $property->loadMissing(['images.metadata', 'documents']);

        $images = $property->images->values();
        $primaryIndex = $images->search(
            fn (PropertyImage $image): bool => $image->is_primary
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
                ->map(fn (PropertyImage $image): array => $this->imageToLegacy($image))
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

        return $this->buildDocumentSlots($property->documents, fn (PropertyDocument $document): array => [
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

        return $this->buildDocumentSlots($property->documents, fn (PropertyDocument $document): array => [
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
     * @param  Collection<int, PropertyDocument>  $documents
     * @param  callable(PropertyDocument): array<string, mixed>  $mapper
     * @return array<string, array<string, mixed>|null>
     */
    private function buildDocumentSlots(Collection $documents, callable $mapper): array
    {
        $slots = [
            PropertyDocument::TYPE_BID_FORM => null,
            PropertyDocument::TYPE_PROSPECT => null,
            PropertyDocument::TYPE_PROPERTY_MAP => null,
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
    public function imageToLegacy(PropertyImage $image): array
    {
        $image->loadMissing('metadata');

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
                'imageAttributesID' => (string) ($image->metadata?->id ?? ''),
                'imageID' => (string) $image->id,
                'caption' => $image->metadata?->caption ?? '',
                'alt' => $image->metadata?->alt ?? '',
                'brightness' => $image->metadata?->brightness ?? 1,
                'gamma' => $image->metadata?->gamma ?? 1,
                'contrast' => $image->metadata?->contrast ?? 1,
                'saturation' => $image->metadata?->saturation ?? 1,
            ],
        ];
    }
}
