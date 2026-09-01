<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('property_areas') && ! Schema::hasTable('legacy_property_areas')) {
            Schema::rename('property_areas', 'legacy_property_areas');
        }

        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->unique()->constrained('properties')->cascadeOnDelete();
            $table->string('address')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('city')->nullable();
            $table->string('municipality')->nullable();
            $table->char('country_code', 2)->default('SE');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('google_place_id')->nullable();
            $table->timestamps();
        });

        Schema::create('location_areas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('sort_order')->default(0);
            $table->decimal('marker_lat', 10, 7)->nullable();
            $table->decimal('marker_lng', 10, 7)->nullable();
            $table->decimal('area_square_meters', 14, 2)->nullable();
            $table->timestamps();

            $table->index(['location_id', 'sort_order']);
        });

        Schema::create('area_points', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('area_id')->constrained('location_areas')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->unique(['area_id', 'sort_order']);
            $table->index(['area_id', 'sort_order']);
        });

        Schema::create('location_pois', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamps();
        });

        $this->migrateLegacyAreas();
        $this->syncSequence('location_areas');

        Schema::dropIfExists('legacy_property_areas');
    }

    public function down(): void
    {
        if (! Schema::hasTable('property_areas')) {
            Schema::create('property_areas', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
                $table->string('name')->default('Område 1');
                $table->longText('area_json');
                $table->decimal('marker_lat', 10, 7)->nullable();
                $table->decimal('marker_lng', 10, 7)->nullable();
                $table->decimal('area_square_meters', 14, 2)->default(0);
                $table->timestamps();
            });

            $this->restoreLegacyAreas();
        }

        Schema::dropIfExists('location_pois');
        Schema::dropIfExists('area_points');
        Schema::dropIfExists('location_areas');
        Schema::dropIfExists('locations');
    }

    private function migrateLegacyAreas(): void
    {
        if (! Schema::hasTable('legacy_property_areas')) {
            return;
        }

        /** @var Collection<int, object> $legacyAreas */
        $legacyAreas = DB::table('legacy_property_areas')
            ->orderBy('property_id')
            ->orderBy('id')
            ->get();

        $locationIdsByProperty = [];
        $sortOrdersByProperty = [];

        foreach ($legacyAreas as $legacyArea) {
            $propertyId = (int) $legacyArea->property_id;
            $polygon = $this->decodePolygon($legacyArea->area_json ?? null);
            $marker = $this->markerForLegacyArea($legacyArea, $polygon);
            $createdAt = $legacyArea->created_at ?? Carbon::now();
            $updatedAt = $legacyArea->updated_at ?? Carbon::now();

            if (! isset($locationIdsByProperty[$propertyId])) {
                $locationIdsByProperty[$propertyId] = DB::table('locations')->insertGetId([
                    'property_id' => $propertyId,
                    'country_code' => 'SE',
                    'latitude' => $marker['lat'],
                    'longitude' => $marker['lng'],
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                ]);
                $sortOrdersByProperty[$propertyId] = 0;
            }

            $areaId = (int) $legacyArea->id;
            $sortOrder = $sortOrdersByProperty[$propertyId]++;

            DB::table('location_areas')->insert([
                'id' => $areaId,
                'location_id' => $locationIdsByProperty[$propertyId],
                'name' => $legacyArea->name ?? 'Område '.($sortOrder + 1),
                'sort_order' => $sortOrder,
                'marker_lat' => $marker['lat'],
                'marker_lng' => $marker['lng'],
                'area_square_meters' => $legacyArea->area_square_meters ?? 0,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);

            foreach ($polygon as $index => $point) {
                DB::table('area_points')->insert([
                    'area_id' => $areaId,
                    'latitude' => $point['lat'],
                    'longitude' => $point['lng'],
                    'sort_order' => $index,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                ]);
            }
        }
    }

    private function restoreLegacyAreas(): void
    {
        if (! Schema::hasTable('location_areas') || ! Schema::hasTable('area_points')) {
            return;
        }

        /** @var Collection<int, object> $areas */
        $areas = DB::table('location_areas')
            ->join('locations', 'locations.id', '=', 'location_areas.location_id')
            ->select([
                'location_areas.id',
                'locations.property_id',
                'location_areas.name',
                'location_areas.marker_lat',
                'location_areas.marker_lng',
                'location_areas.area_square_meters',
                'location_areas.created_at',
                'location_areas.updated_at',
            ])
            ->orderBy('locations.property_id')
            ->orderBy('location_areas.sort_order')
            ->get();

        foreach ($areas as $area) {
            $points = DB::table('area_points')
                ->where('area_id', $area->id)
                ->orderBy('sort_order')
                ->get()
                ->map(static fn (object $point): array => [
                    'lat' => (float) $point->latitude,
                    'lng' => (float) $point->longitude,
                ])
                ->values()
                ->all();

            DB::table('property_areas')->insert([
                'id' => $area->id,
                'property_id' => $area->property_id,
                'name' => $area->name,
                'area_json' => json_encode($points, JSON_THROW_ON_ERROR),
                'marker_lat' => $area->marker_lat,
                'marker_lng' => $area->marker_lng,
                'area_square_meters' => $area->area_square_meters ?? 0,
                'created_at' => $area->created_at,
                'updated_at' => $area->updated_at,
            ]);
        }

        $this->syncSequence('property_areas');
    }

    /**
     * @return array<int, array{lat: float, lng: float}>
     */
    private function decodePolygon(mixed $areaJson): array
    {
        if (! is_string($areaJson) || $areaJson === '') {
            return [];
        }

        $decoded = json_decode($areaJson, true);

        if (! is_array($decoded)) {
            return [];
        }

        $polygon = array_values(array_filter(array_map(
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
            $decoded
        )));

        $first = $polygon[0] ?? null;
        $last = $polygon[array_key_last($polygon)] ?? null;

        if ($first !== null && $last !== null && $first === $last && count($polygon) > 1) {
            array_pop($polygon);
        }

        return $polygon;
    }

    /**
     * @param  array<int, array{lat: float, lng: float}>  $polygon
     * @return array{lat: float|null, lng: float|null}
     */
    private function markerForLegacyArea(object $legacyArea, array $polygon): array
    {
        $lat = $legacyArea->marker_lat ?? ($polygon[0]['lat'] ?? null);
        $lng = $legacyArea->marker_lng ?? ($polygon[0]['lng'] ?? null);

        return [
            'lat' => $lat === null ? null : (float) $lat,
            'lng' => $lng === null ? null : (float) $lng,
        ];
    }

    private function syncSequence(string $table): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            "SELECT setval(pg_get_serial_sequence('{$table}', 'id'), COALESCE((SELECT MAX(id) FROM {$table}), 1))"
        );
    }
};
