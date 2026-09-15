<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Location\Data\AreaData;
use App\Modules\Location\Models\Area;
use App\Modules\Location\Models\AreaPoint;
use App\Modules\Location\Models\Location;
use App\Modules\Property\Models\Property;
use Illuminate\Support\Facades\DB;

class AreaService
{
    /**
     * Return all areas for one property.
     *
     * @return array<string, mixed>
     */
    public function listForProperty(Property $property): array
    {
        $areas = $property->areas()
            ->with(['location', 'points'])
            ->get();

        return [
            'propertyId' => (string) $property->id,
            'totalAreaSquareMeters' => round($areas->sum(
                fn (Area $area): float => $this->areaSquareMeters($area)
            ), 2),
            'areas' => $areas->map(fn (Area $area): array => $this->mapArea($area))->values()->all(),
        ];
    }

    /**
     * Create one area for a property.
     *
     * @return array<string, mixed>
     */
    public function create(Property $property, AreaData $data): array
    {
        $polygon = $data->polygon;
        $area = DB::transaction(function () use ($property, $data, $polygon): Area {
            // Compatibility: old clients could initialize Location through Area.marker.
            // New clients write the main position through Location instead.
            $location = Location::query()->firstOrCreate(['property_id' => $property->id], [
                'latitude' => $data->legacyMarker['lat'] ?? null,
                'longitude' => $data->legacyMarker['lng'] ?? null,
            ]);
            $area = Area::query()->create([
                'location_id' => $location->id,
                'name' => $data->name,
                'sort_order' => $this->nextSortOrder($location),
            ]);

            $this->replacePoints($area, $polygon);

            return $area->fresh(['location', 'points']) ?? $area;
        });

        return $this->mapArea($area);
    }

    /**
     * Return one stored area.
     *
     * @return array<string, mixed>
     */
    public function show(Property $property, Area $area): array
    {
        $this->assertAreaBelongsToProperty($property, $area);

        return $this->mapArea($area);
    }

    /**
     * Replace one stored area.
     *
     * @return array<string, mixed>
     */
    public function replace(Property $property, Area $area, AreaData $data): array
    {
        $this->assertAreaBelongsToProperty($property, $area);

        $polygon = $data->polygon;

        $area = DB::transaction(function () use ($area, $data, $polygon): Area {
            $area->fill([
                'name' => $data->name,
            ]);
            $area->save();

            $this->replacePoints($area, $polygon);

            return $area->fresh(['location', 'points']) ?? $area;
        });

        return $this->mapArea($area);
    }

    /**
     * Delete one stored area.
     */
    public function delete(Property $property, Area $area): void
    {
        $this->assertAreaBelongsToProperty($property, $area);
        $area->delete();
    }

    /**
     * Ensure an area belongs to the requested property.
     */
    private function assertAreaBelongsToProperty(Property $property, Area $area): void
    {
        $area->loadMissing('location');

        if ($area->location?->property_id !== $property->id) {
            abort(404, 'Area does not belong to the property.');
        }
    }

    /**
     * Map one area entity to the frontend response shape.
     *
     * @return array<string, mixed>
     */
    public function mapArea(Area $area): array
    {
        $area->loadMissing(['location', 'points']);

        $polygon = $this->polygon($area);
        $areaSquareMeters = $this->areaSquareMeters($area);

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

    private function nextSortOrder(Location $location): int
    {
        $maxSortOrder = Area::query()
            ->where('location_id', $location->id)
            ->max('sort_order');

        return $maxSortOrder === null ? 0 : ((int) $maxSortOrder) + 1;
    }

    /**
     * @param  array<int, array{lat: float|int, lng: float|int}>  $polygon
     */
    private function replacePoints(Area $area, array $polygon): void
    {
        $area->points()->delete();

        foreach ($this->withoutClosingPoint($polygon) as $index => $point) {
            AreaPoint::query()->create([
                'area_id' => $area->id,
                'latitude' => $point['lat'],
                'longitude' => $point['lng'],
                'sort_order' => $index,
            ]);
        }
    }

    /**
     * @return array<int, array<string, float>>
     */
    private function polygon(Area $area): array
    {
        return $area->points
            ->map(static fn (AreaPoint $point): array => [
                'lat' => (float) $point->latitude,
                'lng' => (float) $point->longitude,
            ])
            ->values()
            ->all();
    }

    private function areaSquareMeters(Area $area): float
    {
        return $this->calculateAreaSquareMeters($this->polygon($area));
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
     * Approximate polygon area in square meters using an equirectangular projection.
     *
     * @param  array<int, array{lat: float|int, lng: float|int}>  $polygon
     */
    private function calculateAreaSquareMeters(array $polygon): float
    {
        $polygon = $this->withoutClosingPoint($polygon);
        $count = count($polygon);

        if ($count < 3) {
            return 0;
        }

        $earthRadius = 6378137.0;
        $averageLatRadians = deg2rad(array_sum(array_map(
            fn (array $point): float => (float) $point['lat'],
            $polygon
        )) / $count);

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

    /**
     * @param  array<int, array{lat: float|int, lng: float|int}>  $polygon
     * @return array<int, array{lat: float|int, lng: float|int}>
     */
    private function withoutClosingPoint(array $polygon): array
    {
        $first = $polygon[0] ?? null;
        $last = $polygon[array_key_last($polygon)] ?? null;

        if ($first !== null && $last !== null && $first == $last && count($polygon) > 1) {
            array_pop($polygon);
        }

        return array_values($polygon);
    }
}
