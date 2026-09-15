<?php

declare(strict_types=1);

namespace App\Modules\Location\Data;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final readonly class AreaData
{
    /**
     * @param list<array{lat: float, lng: float}> $polygon
     * @param array{lat: float, lng: float}|null $legacyMarker
     */
    public function __construct(public string $name, public array $polygon, public ?array $legacyMarker = null) {}

    /** Read only after the enclosing Form Request has validated the input. */
    public static function fromRequest(Request $request, string $prefix = ''): self
    {
        $polygon = [];
        $points = $request->input($prefix.'polygon', []);
        if (is_array($points)) {
            foreach (array_keys($points) as $index) {
                $polygon[] = [
                    'lat' => $request->float($prefix.'polygon.'.$index.'.lat'),
                    'lng' => $request->float($prefix.'polygon.'.$index.'.lng'),
                ];
            }
        }
        if (count(array_unique(array_map(
            static fn (array $point): string => $point['lat'].','.$point['lng'], $polygon,
        ))) < 3) {
            throw ValidationException::withMessages([$prefix.'polygon' => 'Polygonen måste ha minst tre olika punkter.']);
        }

        return new self((string) $request->string($prefix.'name'), $polygon,
            $request->has($prefix.'marker') ? [
                'lat' => $request->float($prefix.'marker.lat'),
                'lng' => $request->float($prefix.'marker.lng'),
            ] : null,
        );
    }
}
