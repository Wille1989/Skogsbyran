<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verify the property details endpoints used by the frontend.
 */
class PropertyDetailsApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure the details flow can create a property.
     */
    public function test_it_stores_property_details(): void
    {
        $response = $this->postJson('/details/store', [
            'title' => 'Skogsgård',
            'caption' => 'Nära sjön',
            'price' => 1800000,
            'size' => 17.5,
        ]);

        $response
            ->assertCreated();

        $this->assertSame('"1"', $response->getContent());

        $this->assertDatabaseHas('properties', [
            'id' => 1,
            'title' => 'Skogsgård',
        ]);
    }

    /**
     * Ensure property details can be patched.
     */
    public function test_it_patches_property_details(): void
    {
        $property = Property::query()->create([
            'title' => 'Old title',
            'caption' => 'Old caption',
        ]);

        $response = $this->patchJson('/details/patchItemDetails/'.$property->id, [
            'title' => 'New title',
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'title' => 'New title',
            'caption' => 'Old caption',
        ]);
    }

    /**
     * Ensure property details can be fully replaced with defaults.
     */
    public function test_it_replaces_property_details_with_put_defaults(): void
    {
        $property = Property::query()->create([
            'title' => 'Old title',
            'caption' => 'Old caption',
            'price' => 1500000,
            'size' => 22,
        ]);

        $response = $this->putJson('/details/item/'.$property->id, [
            'title' => '',
            'caption' => '',
            'price' => '',
            'size' => '',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('property.propertyID', (string) $property->id)
            ->assertJsonPath('property.title', 'Namnlös fastighet')
            ->assertJsonPath('property.caption', 'Ingen beskrivning')
            ->assertJsonPath('property.price', '0.00')
            ->assertJsonPath('property.size', '0.00');

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'title' => 'Namnlös fastighet',
            'caption' => 'Ingen beskrivning',
            'price' => 0,
            'size' => 0,
        ]);
    }

    /**
     * Ensure a single property can be fetched in the wrapper format.
     */
    public function test_it_fetches_one_property_in_legacy_wrapper_format(): void
    {
        $property = Property::query()->create([
            'title' => 'Skogsgård',
            'caption' => 'Nära sjön',
        ]);

        $response = $this->getJson('/details/fetchItemDetails/'.$property->id);

        $response
            ->assertOk()
            ->assertJsonPath('property.propertyID', (string) $property->id)
            ->assertJsonPath('property.title', 'Skogsgård');
    }

    /**
     * Ensure validation catches missing title.
     */
    public function test_it_validates_property_detail_input(): void
    {
        $response = $this->postJson('/details/store', [
            'caption' => 'Missing title',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }
}
