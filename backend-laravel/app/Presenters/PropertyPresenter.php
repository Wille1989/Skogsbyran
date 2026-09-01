<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Models\Area;
use App\Models\Document;
use App\Models\Image;
use App\Models\Property;
use Illuminate\Support\Collection;

final class PropertyPresenter
{
    /**
     * @param  Collection<int, Property>  $properties
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function collectionWrapped(Collection $properties): array
    {
        return [
            'properties' => $properties
                ->map(fn (Property $property): array => $this->property($property))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function wrapped(Property $property): array
    {
        return [
            'property' => $this->property($property),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function property(Property $property): array
    {
        $property->loadMissing([
            'areas',
            'documents',
            'images.metadata',
        ]);

        return [
            'propertyId' => (string) $property->id,
            'details' => [
                'title' => $property->title,
                'caption' => $property->caption ?? '',
                'price' => (string) ($property->price ?? ''),
                'size' => (string) ($property->size ?? ''),
            ],
            'images' => $property->images
                ->map(fn (Image $image): array => $this->image($image))
                ->values()
                ->all(),
            'documents' => $property->documents
                ->map(fn (Document $document): array => $this->document($document))
                ->values()
                ->all(),
            'areas' => $property->areas
                ->map(fn (Area $area): array => $this->area($area))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function image(Image $image): array
    {
        $image->loadMissing('metadata');

        $metadata = $image->metadata;
        $fallbackUrl = $image->medium_url ?: $image->large_url ?: $image->original_url;

        return [
            'imageId' => (string) $image->id,
            'urls' => [
                'thumbnail' => $image->thumb_url ?: $fallbackUrl,
                'medium' => $image->medium_url ?: $fallbackUrl,
                'large' => $image->large_url ?: $fallbackUrl,
            ],
            'position' => $image->position,
            'isPrimary' => $image->is_primary,
            'details' => [
                'caption' => $metadata?->caption ?? '',
                'altText' => $metadata?->alt ?? '',
            ],
            'adjustments' => [
                'brightness' => $metadata?->brightness ?? 1,
                'saturation' => $metadata?->saturation ?? 1,
                'contrast' => $metadata?->contrast ?? 1,
                'gamma' => $metadata?->gamma ?? 1,
            ],
            'createdAt' => $image->created_at?->toISOString(),
            'updatedAt' => $image->updated_at?->toISOString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function document(Document $document): array
    {
        return [
            'propertyId' => (string) $document->property_id,
            'documentId' => (string) $document->id,
            'type' => $document->type,
            'title' => $document->title,
            'url' => $document->url,
            'originalName' => $document->original_name,
            'mimeType' => $document->mime_type,
            'sizeBytes' => $document->size_bytes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function area(Area $area): array
    {
        $polygon = $this->decodeAreaJson($area);

        return [
            'id' => (string) $area->id,
            'propertyId' => (string) $area->property_id,
            'name' => $area->name,
            'polygon' => $polygon,
            'marker' => [
                'lat' => $area->marker_lat ?? ($polygon[0]['lat'] ?? 0),
                'lng' => $area->marker_lng ?? ($polygon[0]['lng'] ?? 0),
            ],
            'areaSquareMeters' => round((float) $area->area_square_meters, 2),
            'areaHectares' => round(((float) $area->area_square_meters) / 10000, 4),
            'createdAt' => $area->created_at?->toISOString(),
            'updatedAt' => $area->updated_at?->toISOString(),
        ];
    }

    /**
     * @return array<int, array<string, float>>
     */
    private function decodeAreaJson(Area $area): array
    {
        $polygon = json_decode($area->area_json, true);

        if (! is_array($polygon)) {
            return [];
        }

        return array_values(array_filter(
            array_map(
                static function (mixed $point): ?array {
                    if (
                        ! is_array($point)
                        || ! isset($point['lat'], $point['lng'])
                        || ! is_numeric($point['lat'])
                        || ! is_numeric($point['lng'])
                    ) {
                        return null;
                    }

                    return [
                        'lat' => (float) $point['lat'],
                        'lng' => (float) $point['lng'],
                    ];
                },
                $polygon
            )
        ));
    }
}
