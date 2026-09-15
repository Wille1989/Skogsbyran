<?php

declare(strict_types=1);

namespace App\Modules\Location\Data;

use Illuminate\Http\Request;

final readonly class LocationData
{
    /** @param list<array{name: string, description: string, latitude: float, longitude: float}> $pois */
    public function __construct(
        public string $address,
        public string $postalCode,
        public string $city,
        public string $municipality,
        public string $countryCode,
        public ?float $latitude,
        public ?float $longitude,
        public string $googlePlaceId,
        public array $pois,
    ) {}

    /** Read only after the enclosing Form Request has validated the input. */
    public static function fromRequest(Request $request, string $prefix = ''): self
    {
        $pois = [];
        $input = $request->input($prefix.'pois', []);
        if (is_array($input)) {
            foreach (array_keys($input) as $index) {
                $key = $prefix.'pois.'.$index.'.';
                $pois[] = [
                    'name' => (string) $request->string($key.'name'),
                    'description' => (string) $request->string($key.'description'),
                    'latitude' => $request->float($key.'latitude'),
                    'longitude' => $request->float($key.'longitude'),
                ];
            }
        }

        return new self(
            (string) $request->string($prefix.'address'),
            (string) $request->string($prefix.'postal_code'),
            (string) $request->string($prefix.'city'),
            (string) $request->string($prefix.'municipality'),
            strtoupper((string) $request->string($prefix.'country_code', 'SE')),
            $request->filled($prefix.'latitude') ? $request->float($prefix.'latitude') : null,
            $request->filled($prefix.'longitude') ? $request->float($prefix.'longitude') : null,
            (string) $request->string($prefix.'google_place_id'),
            $pois,
        );
    }
}
