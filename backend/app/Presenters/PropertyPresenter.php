<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Infrastructure\Storage\ObjectStorage;
use App\Modules\Document\Enums\DocumentVariantName;
use App\Modules\Document\Models\Document;
use App\Modules\Image\Enums\ImageVariantName;
use App\Modules\Image\Models\Image;
use App\Modules\Location\Models\Area;
use App\Modules\Location\Models\Location;
use App\Modules\Location\Models\PointOfInterest;
use App\Modules\Property\Models\Property;
use Illuminate\Support\Collection;

final class PropertyPresenter
{
    private const TEMPORARY_URL_MINUTES = 60;

    public function __construct(
        private readonly ObjectStorage $objectStorage,
    ) {
    }

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
            'areas.location',
            'areas.points',
            'documents.variants',
            'images.metadata',
            'images.adjustment',
            'images.variants',
            'location.pois',
        ]);

        return [
            'propertyId' => (string) $property->id,
            'details' => [
                'title' => $property->title,
                'caption' => $property->caption ?? '',
                'price' => (string) ($property->price_whole_units ?? $property->price ?? ''),
                'size' => (string) ($property->size_hectares ?? $property->size ?? ''),
                'slug' => $property->slug ?? '',
                'listingStatus' => $property->listing_status?->value ?? 'available',
                'isVisible' => $property->is_visible ?? true,
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
            'location' => $property->location
                ? $this->location($property->location)
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function location(Location $location): array
    {
        $location->loadMissing('pois');

        return [
            'address' => $location->address ?? '',
            'postalCode' => $location->postal_code ?? '',
            'city' => $location->city ?? '',
            'municipality' => $location->municipality ?? '',
            'countryCode' => $location->country_code,
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'googlePlaceId' => $location->google_place_id ?? '',
            'pois' => $location->pois
                ->map(fn (PointOfInterest $poi): array => $this->poi($poi))
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function poi(PointOfInterest $poi): array
    {
        return [
            'id' => (string) $poi->id,
            'name' => $poi->name,
            'description' => $poi->description ?? '',
            'latitude' => $poi->latitude,
            'longitude' => $poi->longitude,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function image(Image $image): array
    {
        $image->loadMissing(['metadata', 'adjustment', 'variants']);

        $metadata = $image->metadata;
        $adjustment = $image->adjustment;
        $urls = $this->imageVariantUrls($image);
        $fallbackUrl = $urls[ImageVariantName::Medium->value]
            ?? $urls[ImageVariantName::Large->value]
            ?? $urls[ImageVariantName::Thumb->value]
            ?? '';

        return [
            'imageId' => (string) $image->id,
            'urls' => [
                'thumbnail' => $urls[ImageVariantName::Thumb->value] ?? $fallbackUrl,
                'medium' => $urls[ImageVariantName::Medium->value] ?? $fallbackUrl,
                'large' => $urls[ImageVariantName::Large->value] ?? $fallbackUrl,
            ],
            'position' => $image->sort_order,
            'isPrimary' => $image->is_primary,
            'details' => [
                'caption' => $metadata?->caption ?? '',
                'altText' => $metadata?->alt_text ?? '',
            ],
            'adjustments' => [
                'brightness' => $adjustment?->brightness ?? 1,
                'saturation' => $adjustment?->saturation ?? 1,
                'contrast' => $adjustment?->contrast ?? 1,
                'gamma' => $adjustment?->gamma ?? 1,
            ],
            'createdAt' => $image->created_at?->toISOString(),
            'updatedAt' => $image->updated_at?->toISOString(),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function imageVariantUrls(Image $image): array
    {
        $urls = [];

        foreach ($image->variants as $variant) {
            $urls[$variant->variant->value] = $this->objectStorage->temporaryUrl(
                ObjectStorage::IMAGES_DISK,
                $variant->storage_key,
                now()->addMinutes(self::TEMPORARY_URL_MINUTES)
            );
        }

        return $urls;
    }

    /**
     * @return array<string, mixed>
     */
    public function document(Document $document): array
    {
        $document->loadMissing('variants');

        $variant = $document->variants->first(
            static fn ($variant): bool =>
                $variant->variant === DocumentVariantName::Original
        ) ?? $document->variants->first(
            static fn ($variant): bool =>
                $variant->variant === DocumentVariantName::Preview
        );

        $pivot = $document->pivot;

        return [
            'propertyId' => (string) ($pivot?->property_id ?? ''),
            'documentId' => (string) $document->id,
            'type' => $pivot?->type ?? 'document',
            'title' => $pivot?->title ?? $document->name,
            'url' => $variant ? $this->objectStorage->temporaryUrl(
                ObjectStorage::DOCUMENTS_DISK,
                $variant->storage_key,
                now()->addMinutes(self::TEMPORARY_URL_MINUTES)
            ) : '',
            'originalName' => $document->original_filename,
            'mimeType' => $document->mime_type,
            'sizeBytes' => $variant?->file_size ?? 0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function area(Area $area): array
    {
        $area->loadMissing(['location', 'points']);

        $polygon = $this->polygon($area);
        $areaSquareMeters = $this->calculateAreaSquareMeters($polygon);

        return [
            'id' => (string) $area->id,
            'propertyId' => (string) ($area->location?->property_id ?? ''),
            'name' => $area->name,
            'polygon' => $polygon,
            'marker' => $this->marker($polygon),
            'areaSquareMeters' => round($areaSquareMeters, 2),
            'areaHectares' => round($areaSquareMeters / 10000, 4),
            'createdAt' => $area->created_at?->toISOString(),
            'updatedAt' => $area->updated_at?->toISOString(),
        ];
    }

    /**
     * @return array<int, array<string, float>>
     */
    private function polygon(Area $area): array
    {
        return $area->points
            ->map(static fn ($point): array => [
                'lat' => (float) $point->latitude,
                'lng' => (float) $point->longitude,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<string, float>>  $polygon
     * @return array{lat: float, lng: float}
     */
    private function marker(array $polygon): array
    {
        if ($polygon === []) {
            return [
                'lat' => 0.0,
                'lng' => 0.0,
            ];
        }

        return [
            'lat' => array_sum(array_column($polygon, 'lat')) / count($polygon),
            'lng' => array_sum(array_column($polygon, 'lng')) / count($polygon),
        ];
    }

    /**
     * @param  array<int, array<string, float>>  $polygon
     */
    private function calculateAreaSquareMeters(array $polygon): float
    {
        $count = count($polygon);

        if ($count < 3) {
            return 0;
        }

        $earthRadius = 6378137.0;
        $averageLatRadians = deg2rad(array_sum(array_column($polygon, 'lat')) / $count);

        $projected = array_map(function (array $point) use ($earthRadius, $averageLatRadians): array {
            $lat = deg2rad((float) $point['lat']);
            $lng = deg2rad((float) $point['lng']);

            return [
                'x' => $earthRadius * $lng * cos($averageLatRadians),
                'y' => $earthRadius * $lat,
            ];
        }, $polygon);

        $area = 0.0;

        for ($index = 0; $index < $count; $index++) {
            $next = ($index + 1) % $count;
            $area += ($projected[$index]['x'] * $projected[$next]['y'])
                - ($projected[$next]['x'] * $projected[$index]['y']);
        }

        return abs($area) / 2;
    }
}
