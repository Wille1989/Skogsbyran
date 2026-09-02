<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Location\Models\Location;
use App\Modules\Location\Models\PointOfInterest;
use App\Modules\Property\Models\Property;
use App\Presenters\PropertyPresenter;
use Illuminate\Support\Facades\DB;

final class LocationService
{
    public function __construct(
        private readonly PropertyPresenter $propertyPresenter,
    ) {
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public function replace(Property $property, array $validated): array
    {
        $location = DB::transaction(function () use ($property, $validated): Location {
            $location = Location::query()->firstOrNew([
                'property_id' => $property->id,
            ]);

            $location->fill([
                'address' => $validated['address'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'city' => $validated['city'] ?? null,
                'municipality' => $validated['municipality'] ?? null,
                'country_code' => strtoupper((string) ($validated['country_code'] ?? 'SE')),
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'google_place_id' => $validated['google_place_id'] ?? null,
            ]);
            $location->save();

            $location->pois()->delete();

            foreach ($validated['pois'] ?? [] as $poi) {
                PointOfInterest::query()->create([
                    'location_id' => $location->id,
                    'name' => $poi['name'],
                    'description' => $poi['description'] ?? null,
                    'latitude' => $poi['latitude'],
                    'longitude' => $poi['longitude'],
                ]);
            }

            return $location->fresh(['pois']) ?? $location;
        });

        return $this->propertyPresenter->location($location);
    }
}
