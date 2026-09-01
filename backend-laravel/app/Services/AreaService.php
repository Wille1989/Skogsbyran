<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Property;
use App\Models\Area;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;


class AreaService
{
    /**
     * Return all areas for one property.
     *
     * @return array<string, mixed>
     */
    public function listForProperty(Property $property): array
    {
        $areas = $property->areas()->get();

        return [
            'propertyId' => (string) $property->id,
            'totalAreaSquareMeters' => round($areas->sum('area_square_meters'), 2),
            'areas' => $areas->map(fn (Area $area): array => $this->mapArea($area))->values()->all(),
        ];
    }

    /**
     * Create one area for a property.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public function create(Property $property, array $validated): array
    {
        $polygon = $validated['polygon'];
        $squareMeters = $this->calculateAreaSquareMeters($polygon);

        $area = Area::query()->create([
            'property_id' => $property->id,
            'name' => $validated['name'],
            'area_json' => json_encode($polygon, JSON_THROW_ON_ERROR),
            'marker_lat' => $validated['marker']['lat'],
            'marker_lng' => $validated['marker']['lng'],
            'area_square_meters' => $squareMeters,
        ]);

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
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public function replace(Property $property, Area $area, array $validated): array
    {
        $this->assertAreaBelongsToProperty($property, $area);

        $polygon = $validated['polygon'];

        $area->fill([
            'name' => $validated['name'],
            'area_json' => json_encode($polygon, JSON_THROW_ON_ERROR),
            'marker_lat' => $validated['marker']['lat'],
            'marker_lng' => $validated['marker']['lng'],
            'area_square_meters' => $this->calculateAreaSquareMeters($polygon),
        ]);
        $area->save();

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
        if ($area->property_id !== $property->id) {
            throw new InvalidArgumentException('Area does not belong to the property.');
        }
    }

    /**
     * Map one area entity to the frontend response shape.
     *
     * @return array<string, mixed>
     */
    private function mapArea(Area $area): array
    {
        $polygon = json_decode($area->area_json, true, 512, JSON_THROW_ON_ERROR);

        return [
            'id' => (string) $area->id,
            'propertyId' => (string) $area->property_id,
            'name' => $area->name,
            'polygon' => $polygon,
            'marker' => [
                'lat' => $area->marker_lat,
                'lng' => $area->marker_lng,
            ],
            'areaSquareMeters' => round((float) $area->area_square_meters, 2),
            'areaHectares' => round(((float) $area->area_square_meters) / 10000, 4),
            'createdAt' => $area->created_at?->toISOString(),
            'updatedAt' => $area->updated_at?->toISOString(),
        ];
    }

    /**
     * Approximate polygon area in square meters using an equirectangular projection.
     *
     * @param  array<int, array{lat: float|int, lng: float|int}>  $polygon
     */
    private function calculateAreaSquareMeters(array $polygon): float
    {
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
}
