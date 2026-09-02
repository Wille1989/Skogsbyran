<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class LocationModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_replaces_property_location_and_pois(): void
    {
        Sanctum::actingAs(User::factory()->create(['admin' => true]), ['admin']);

        $property = Property::query()->create([
            'title' => 'Location POI property',
            'caption' => 'Location and points of interest',
        ]);

        $this->putJson('/property/'.$property->id.'/location', [
            'address' => 'Skogsvägen 12',
            'postalCode' => '791 31',
            'city' => 'Falun',
            'municipality' => 'Falun',
            'countryCode' => 'SE',
            'latitude' => 60.6065,
            'longitude' => 15.6355,
            'googlePlaceId' => 'google-place-123',
            'pois' => [
                [
                    'name' => 'Badplats',
                    'description' => 'Ungefär 3 km från fastigheten.',
                    'latitude' => 60.61,
                    'longitude' => 15.64,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('address', 'Skogsvägen 12')
            ->assertJsonPath('postalCode', '791 31')
            ->assertJsonPath('googlePlaceId', 'google-place-123')
            ->assertJsonPath('pois.0.name', 'Badplats');

        $this->assertDatabaseHas('locations', [
            'property_id' => $property->id,
            'address' => 'Skogsvägen 12',
            'postal_code' => '791 31',
            'city' => 'Falun',
            'google_place_id' => 'google-place-123',
        ]);
        $this->assertDatabaseHas('location_pois', [
            'name' => 'Badplats',
            'description' => 'Ungefär 3 km från fastigheten.',
        ]);

        $this->putJson('/property/'.$property->id.'/location', [
            'address' => 'Ny adress 4',
            'countryCode' => 'SE',
            'pois' => [],
        ])->assertOk()->assertJsonCount(0, 'pois');

        $this->assertDatabaseHas('locations', [
            'property_id' => $property->id,
            'address' => 'Ny adress 4',
        ]);
        $this->assertDatabaseCount('location_pois', 0);
    }

    public function test_it_stores_location_areas_with_ordered_points(): void
    {
        Sanctum::actingAs(User::factory()->create(['admin' => true]), ['admin']);

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
            ->assertJsonPath('polygon.1.lng', 18.25);

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
            ->assertJsonCount(3, 'polygon');

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
