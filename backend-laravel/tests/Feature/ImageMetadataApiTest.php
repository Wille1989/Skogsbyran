<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verify the image metadata endpoints.
 */
class ImageMetadataApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure metadata can be stored and fetched for an image.
     */
    public function test_it_stores_and_fetches_image_metadata(): void
    {
        $image = $this->makeImage();

        $storeResponse = $this->postJson('/imageSettings/store/'.$image->id, [
            'description' => 'Solbelyst skogsbild',
            'altText' => 'Tallskog i kvällssol',
            'brightness' => 1.1,
            'saturation' => 1.2,
            'contrast' => 1.3,
            'gamma' => 1.0,
        ]);

        $storeResponse
            ->assertCreated()
            ->assertJsonPath('imageId', (string) $image->id)
            ->assertJsonPath('description', 'Solbelyst skogsbild');

        $fetchResponse = $this->getJson('/imageSettings/fetch/'.$image->id);

        $fetchResponse
            ->assertOk()
            ->assertJsonPath('altText', 'Tallskog i kvällssol');
    }

    /**
     * Ensure metadata can be patched.
     */
    public function test_it_updates_image_metadata(): void
    {
        $image = $this->makeImage();

        $this->postJson('/imageSettings/store/'.$image->id, [
            'description' => 'Before',
            'altText' => 'Before alt',
            'brightness' => 1,
            'saturation' => 1,
            'contrast' => 1,
            'gamma' => 1,
        ]);

        $response = $this->patchJson('/imageSettings/update/'.$image->id, [[
            'imageId' => (string) $image->id,
            'description' => 'After',
        ]]);

        $response
            ->assertOk()
            ->assertJsonPath('description', 'After');
    }

    /**
     * Ensure metadata can be fully replaced with defaults via PUT.
     */
    public function test_it_replaces_image_metadata_with_put_defaults(): void
    {
        $image = $this->makeImage();

        $response = $this->putJson('/imageSettings/item/'.$image->id, [
            'description' => '',
            'altText' => '',
            'brightness' => '',
            'saturation' => '',
            'contrast' => '',
            'gamma' => '',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('imageId', (string) $image->id)
            ->assertJsonPath('description', 'Standardbeskrivning')
            ->assertJsonPath('altText', 'Standard alt-text')
            ->assertJsonPath('brightness', 1)
            ->assertJsonPath('gamma', 1);
    }

    /**
     * Ensure metadata input is validated.
     */
    public function test_it_validates_image_metadata_input(): void
    {
        $image = $this->makeImage();

        $response = $this->postJson('/imageSettings/store/'.$image->id, []);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'description',
                'altText',
                'brightness',
                'saturation',
                'contrast',
                'gamma',
            ]);
    }

    /**
     * Create a property image fixture.
     */
    private function makeImage(): PropertyImage
    {
        $property = Property::query()->create([
            'title' => 'Forest estate',
        ]);

        return PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 0,
            'is_primary' => true,
            'original_url' => '/storage/image.jpg',
            'thumb_url' => '/storage/image.jpg',
            'medium_url' => '/storage/image.jpg',
            'large_url' => '/storage/image.jpg',
        ]);
    }
}
