<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Location\Data\LocationData;
use App\Modules\Location\Models\Location;
use App\Modules\Location\Models\PointOfInterest;
use App\Modules\Property\Models\Property;
use App\Presenters\PropertyPresenter;
use Illuminate\Support\Facades\DB;

final class LocationService
{
    public function __construct(
        private readonly PropertyPresenter $propertyPresenter,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function replace(Property $property, LocationData $data): array
    {
        $location = DB::transaction(function () use ($property, $data): Location {
            $location = Location::query()->firstOrNew([
                'property_id' => $property->id,
            ]);

            $location->fill([
                'address' => $data->address,
                'postal_code' => $data->postalCode,
                'city' => $data->city,
                'municipality' => $data->municipality,
                'country_code' => $data->countryCode,
                'latitude' => $data->latitude,
                'longitude' => $data->longitude,
                'google_place_id' => $data->googlePlaceId,
            ]);
            $location->save();

            $location->pois()->delete();

            foreach ($data->pois as $poi) {
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
