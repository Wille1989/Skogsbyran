<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Property;
use App\Models\PropertyArea;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verify property area CRUD endpoints.
 */
class PropertyAreaApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_lists_updates_and_deletes_property_areas(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest estate',
        ]);

        $createResponse = $this->postJson('/property/'.$property->id.'/areas', [
            'name' => 'Norra skiftet',
            'polygon' => [
                ['lat' => 59.10, 'lng' => 18.20],
                ['lat' => 59.11, 'lng' => 18.25],
                ['lat' => 59.09, 'lng' => 18.27],
            ],
            'marker' => [
                'lat' => 59.105,
                'lng' => 18.225,
            ],
        ]);

        $areaId = $createResponse->json('id');

        $createResponse
            ->assertCreated()
            ->assertJsonPath('propertyId', (string) $property->id)
            ->assertJsonPath('name', 'Norra skiftet');

        $this->postJson('/property/'.$property->id.'/areas', [
            'name' => 'Södra skiftet',
            'polygon' => [
                ['lat' => 59.20, 'lng' => 18.30],
                ['lat' => 59.21, 'lng' => 18.35],
                ['lat' => 59.19, 'lng' => 18.36],
            ],
            'marker' => [
                'lat' => 59.205,
                'lng' => 18.325,
            ],
        ])->assertCreated();

        $this->getJson('/property/'.$property->id.'/areas')
            ->assertOk()
            ->assertJsonCount(2, 'areas');

        $this->getJson('/property/'.$property->id.'/areas/'.$areaId)
            ->assertOk()
            ->assertJsonPath('id', (string) $areaId)
            ->assertJsonPath('marker.lat', 59.105);

        $this->putJson('/property/'.$property->id.'/areas/'.$areaId, [
            'name' => 'Norra skiftet uppdaterat',
            'polygon' => [
                ['lat' => 59.10, 'lng' => 18.20],
                ['lat' => 59.12, 'lng' => 18.26],
                ['lat' => 59.08, 'lng' => 18.28],
            ],
            'marker' => [
                'lat' => 59.101,
                'lng' => 18.221,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Norra skiftet uppdaterat')
            ->assertJsonPath('marker.lng', 18.221);

        $this->deleteJson('/property/'.$property->id.'/areas/'.$areaId)
            ->assertNoContent();

        $this->assertDatabaseMissing('property_areas', [
            'id' => $areaId,
        ]);
    }

    public function test_it_validates_property_area_input(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest estate',
        ]);

        $response = $this->postJson('/property/'.$property->id.'/areas', [
            'name' => '',
            'polygon' => [],
            'marker' => [],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['polygon', 'marker.lat', 'marker.lng']);
    }

    public function test_it_returns_not_found_when_area_is_missing(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest estate',
        ]);

        $this->getJson('/property/'.$property->id.'/areas/999999')
            ->assertNotFound();
    }
}

