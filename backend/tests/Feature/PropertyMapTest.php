<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PropertyMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_round_trips_map_data_and_keeps_declared_hectares(): void
    {
        $this->actingAs(User::factory()->create(['admin' => true]));
        $response = $this->postJson('/property', [
            'details' => ['title' => 'Karta', 'caption' => 'Skog', 'price' => '100', 'size' => '42.6'],
            'images' => [],
            'areas' => [$this->area(), $this->area()],
            'location' => $this->location(),
        ])->assertCreated()->assertJsonCount(2, 'property.areas')
            ->assertJsonPath('property.location.latitude', 59.5)
            ->assertJsonPath('property.location.postalCode', '12345')
            ->assertJsonPath('property.location.pois.0.name', 'Brygga')
            ->assertJsonPath('property.areas.0.polygon.1.lng', 18.02);
        $id = $response->json('property.propertyId');
        $this->getJson('/property/'.$id)->assertOk()->assertJsonCount(1, 'property.location.pois');
        $this->getJson('/properties')->assertJsonPath('properties.0.details.size', '42.6000');
        $this->getJson('/property/'.$id.'/areas')->assertOk()->assertJsonCount(2, 'areas');
        $this->assertDatabaseCount('area_points', 6);
    }

    public function test_location_without_polygon_and_poi_move_rename_delete(): void
    {
        $this->actingAs(User::factory()->create(['admin' => true]));
        $property = Property::query()->create(['title' => 'Plats']);
        $payload = $this->location();
        $this->putJson('/property/'.$property->id.'/location', $payload)->assertOk();
        $payload['latitude'] = 60.5;
        $payload['pois'][0]['name'] = 'Bostadshus';
        $payload['pois'][0]['longitude'] = 17.5;
        $this->putJson('/property/'.$property->id.'/location', $payload)
            ->assertOk()->assertJsonPath('latitude', 60.5)->assertJsonPath('pois.0.longitude', 17.5);
        $payload['pois'] = [];
        $this->putJson('/property/'.$property->id.'/location', $payload)->assertOk()->assertJsonCount(0, 'pois');
        $this->assertDatabaseCount('location_pois', 0);
        $this->assertDatabaseCount('location_areas', 0);
    }

    public function test_invalid_geometry_does_not_replace_existing_polygon_or_create_property(): void
    {
        $this->actingAs(User::factory()->create(['admin' => true]));
        $property = Property::query()->create(['title' => 'Validering']);
        $area = $this->postJson('/property/'.$property->id.'/area', $this->area())->assertCreated()->json('id');
        foreach ([[], [['lat' => 59, 'lng' => 18]], array_fill(0, 3, ['lat' => 59, 'lng' => 18]),
            [['lat' => 91, 'lng' => 18], ['lat' => 59, 'lng' => 18], ['lat' => 59, 'lng' => 19]]] as $polygon) {
            $this->putJson('/property/'.$property->id.'/area/'.$area.'/update', ['name' => 'Fel', 'polygon' => $polygon])->assertUnprocessable();
        }
        $this->getJson('/property/'.$property->id.'/area/'.$area)->assertJsonPath('name', 'Skifte');
        $this->assertDatabaseCount('area_points', 3);
        $this->postJson('/property', [
            'details' => ['title' => 'Fel', 'caption' => 'Skog', 'price' => '100', 'size' => '42.6'],
            'images' => [], 'areas' => [['name' => 'Fel', 'polygon' => array_fill(0, 3, ['lat' => 59, 'lng' => 18])]],
        ])->assertUnprocessable();
        $this->assertDatabaseCount('properties', 1);
        $payload = $this->location();
        $payload['longitude'] = null;
        $this->putJson('/property/'.$property->id.'/location', $payload)->assertUnprocessable();
    }

    public function test_area_ownership_and_public_visibility_are_enforced(): void
    {
        $admin = User::factory()->create(['admin' => true]);
        $this->actingAs($admin);
        $hidden = Property::query()->create(['title' => 'Dold', 'is_visible' => false]);
        $visible = Property::query()->create(['title' => 'Publik', 'is_visible' => true]);
        $areaId = $this->postJson('/property/'.$hidden->id.'/area', $this->area())->assertCreated()->json('id');
        $this->getJson('/property/'.$visible->id.'/area/'.$areaId)->assertNotFound();
        $this->putJson('/property/'.$visible->id.'/area/'.$areaId.'/update', $this->area())->assertNotFound();
        $this->deleteJson('/property/'.$visible->id.'/area/'.$areaId.'/delete')->assertNotFound();
        $this->getJson('/property/'.$hidden->id)->assertOk();
        $this->actingAs(User::factory()->create(['admin' => false]));
        $this->getJson('/property/'.$hidden->id)->assertNotFound();
        $this->getJson('/property/'.$hidden->id.'/areas')->assertNotFound();
        $this->getJson('/property/'.$hidden->id.'/area/'.$areaId)->assertNotFound();
        foreach ([false, true] as $guest) {
            if ($guest) {
                auth()->forgetGuards();
            }
            $status = $guest ? 401 : 403;
            $this->postJson('/property', [])->assertStatus($status);
            $this->postJson('/property/'.$visible->id.'/area', $this->area())->assertStatus($status);
            $this->putJson('/property/'.$hidden->id.'/area/'.$areaId.'/update', $this->area())->assertStatus($status);
            $this->deleteJson('/property/'.$hidden->id.'/area/'.$areaId.'/delete')->assertStatus($status);
            $this->putJson('/property/'.$visible->id.'/location', $this->location())->assertStatus($status);
        }
    }

    /** @return array{name: string, polygon: list<array{lat: float, lng: float}>} */
    private function area(): array
    {
        return ['name' => 'Skifte', 'polygon' => [
            ['lat' => 59.0, 'lng' => 18.0], ['lat' => 59.01, 'lng' => 18.02], ['lat' => 59.02, 'lng' => 18.0],
        ]];
    }

    /** @return array{countryCode: string, postalCode: string, latitude: float, longitude: float|null, pois: list<array{name: string, latitude: float, longitude: float}>} */
    private function location(): array
    {
        return ['countryCode' => 'SE', 'postalCode' => '12345', 'latitude' => 59.5, 'longitude' => 18.5,
            'pois' => [['name' => 'Brygga', 'latitude' => 59.51, 'longitude' => 18.51]]];
    }
}
