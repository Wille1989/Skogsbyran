<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Middleware\EnsureAdminJwt;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class LocationModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_stores_property_areas_as_location_areas_with_ordered_points(): void
    {
        $this->withoutMiddleware(EnsureAdminJwt::class);

        $property = Property::query()->create([
            'title' => 'Location module property',
            'caption' => 'Normalized area geometry',
        ]);

        $createResponse = $this->postJson('/property/'.$property->id.'/area', [
            'name' => 'Norra skiftet',
            'polygon' => [
                ['lat' => 59.1, 'lng' => 18.2],
                ['lat' => 59.11, 'lng' => 18.25],
                ['lat' => 59.09, 'lng' => 18.27],
            ],
            'marker' => [
                'lat' => 59.105,
                'lng' => 18.225,
            ],
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('propertyId', (string) $property->id)
            ->assertJsonPath('name', 'Norra skiftet')
            ->assertJsonPath('polygon.0.lat', 59.1)
            ->assertJsonPath('polygon.1.lng', 18.25)
            ->assertJsonPath('marker.lat', 59.105);

        $areaId = (int) $createResponse->json('id');
        $locationId = (int) DB::table('locations')
            ->where('property_id', $property->id)
            ->value('id');

        $this->assertDatabaseCount('locations', 1);
        $this->assertDatabaseHas('location_areas', [
            'id' => $areaId,
            'location_id' => $locationId,
            'name' => 'Norra skiftet',
            'sort_order' => 0,
        ]);
        $this->assertDatabaseHas('area_points', [
            'area_id' => $areaId,
            'latitude' => 59.11,
            'longitude' => 18.25,
            'sort_order' => 1,
        ]);
        $this->assertDatabaseCount('area_points', 3);
        $this->assertFalse(Schema::hasTable('property_areas'));

        $this->getJson('/property/'.$property->id.'/areas')
            ->assertOk()
            ->assertJsonPath('propertyId', (string) $property->id)
            ->assertJsonCount(1, 'areas')
            ->assertJsonPath('areas.0.id', (string) $areaId)
            ->assertJsonPath('areas.0.polygon.2.lng', 18.27);

        $this->putJson('/property/'.$property->id.'/area/'.$areaId.'/update', [
            'name' => 'Norra skiftet uppdaterat',
            'polygon' => [
                ['lat' => 59.2, 'lng' => 18.3],
                ['lat' => 59.21, 'lng' => 18.35],
                ['lat' => 59.19, 'lng' => 18.36],
                ['lat' => 59.2, 'lng' => 18.3],
            ],
            'marker' => [
                'lat' => 59.205,
                'lng' => 18.325,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Norra skiftet uppdaterat')
            ->assertJsonCount(3, 'polygon')
            ->assertJsonPath('marker.lng', 18.325);

        $this->assertDatabaseCount('area_points', 3);

        $this->deleteJson('/property/'.$property->id.'/area/'.$areaId.'/delete')
            ->assertNoContent();

        $this->assertDatabaseMissing('location_areas', [
            'id' => $areaId,
        ]);
        $this->assertDatabaseMissing('area_points', [
            'area_id' => $areaId,
        ]);
    }
}
