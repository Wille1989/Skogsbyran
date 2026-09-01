<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyImageAttribute;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Verify the dedicated property image API.
 */
class PropertyImageApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function decodeStorageKeys(string $storageKey): array
    {
        $decoded = json_decode($storageKey, true, 512, JSON_THROW_ON_ERROR);

        $this->assertIsArray($decoded);

        return $decoded;
    }

    /**
     * Build a valid image upload for the variant pipeline.
     */
    private function fakePngUpload(string $name): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1600, 900);
    }

    public function test_it_stores_bulk_images_for_a_property(): void
    {
        Storage::fake('public');

        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $response = $this->post('/property/image/create/'.$property->id, [
            'images' => [
                $this->fakePngUpload('forest-1.png'),
                $this->fakePngUpload('forest-2.png'),
            ],
            'position' => [0, 1],
            'isPrimary' => ['1', '0'],
        ]);

        $response
            ->assertCreated()
            ->assertJsonCount(2)
            ->assertJsonPath('0.position', 0)
            ->assertJsonPath('0.isPrimary', true)
            ->assertJsonPath('0.attributes.caption', '');

        $this->assertDatabaseCount('property_images', 2);
        $this->assertDatabaseHas('property_images', [
            'property_id' => $property->id,
            'is_primary' => true,
        ]);

        $image = PropertyImage::query()->where('property_id', $property->id)->firstOrFail();
        $storageKeys = $this->decodeStorageKeys((string) $image->storage_key);

        Storage::disk('public')->assertExists($storageKeys['thumb']);
        Storage::disk('public')->assertExists($storageKeys['medium']);
        Storage::disk('public')->assertExists($storageKeys['large']);

        $this->assertStringEndsWith('.webp', $image->thumb_url ?? '');
        $this->assertStringEndsWith('.webp', $image->medium_url ?? '');
        $this->assertStringEndsWith('.webp', $image->large_url ?? '');
    }

    public function test_it_validates_image_upload_input(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $response = $this->postJson('/property/image/create/'.$property->id, []);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['images']);
    }

    public function test_it_updates_existing_images_for_a_property(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $first = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 0,
            'is_primary' => true,
            'original_url' => '/storage/a.jpg',
            'thumb_url' => '/storage/a.jpg',
            'medium_url' => '/storage/a.jpg',
            'large_url' => '/storage/a.jpg',
            'storage_key' => 'properties/'.$property->id.'/a.jpg',
        ]);

        $second = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 1,
            'is_primary' => false,
            'original_url' => '/storage/b.jpg',
            'thumb_url' => '/storage/b.jpg',
            'medium_url' => '/storage/b.jpg',
            'large_url' => '/storage/b.jpg',
            'storage_key' => 'properties/'.$property->id.'/b.jpg',
        ]);

        $response = $this->patchJson('/property/image/edit/'.$property->id, [
            [
                'imageId' => $first->id,
                'position' => 2,
            ],
            [
                'imageId' => $second->id,
                'isPrimary' => true,
            ],
        ]);

        $response->assertOk();

        $this->assertSame('true', $response->getContent());

        $this->assertDatabaseHas('property_images', [
            'id' => $first->id,
            'position' => 2,
            'is_primary' => false,
        ]);

        $this->assertDatabaseHas('property_images', [
            'id' => $second->id,
            'is_primary' => true,
        ]);
    }

    public function test_it_replaces_property_images_without_reuploading_existing_ones(): void
    {
        Storage::fake('public');

        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $keep = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 0,
            'is_primary' => true,
            'original_url' => '/storage/keep.jpg',
            'thumb_url' => '/storage/keep.jpg',
            'medium_url' => '/storage/keep.jpg',
            'large_url' => '/storage/keep.jpg',
            'storage_key' => 'properties/'.$property->id.'/keep.jpg',
        ]);

        PropertyImageAttribute::query()->create([
            'image_id' => $keep->id,
            'caption' => '',
            'alt' => '',
            'brightness' => 1,
            'gamma' => 1,
            'contrast' => 1,
            'saturation' => 1,
        ]);

        $remove = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 1,
            'is_primary' => false,
            'original_url' => '/storage/remove.jpg',
            'thumb_url' => '/storage/remove.jpg',
            'medium_url' => '/storage/remove.jpg',
            'large_url' => '/storage/remove.jpg',
            'storage_key' => 'properties/'.$property->id.'/remove.jpg',
        ]);

        PropertyImageAttribute::query()->create([
            'image_id' => $remove->id,
            'caption' => '',
            'alt' => '',
            'brightness' => 1,
            'gamma' => 1,
            'contrast' => 1,
            'saturation' => 1,
        ]);

        Storage::disk('public')->put($keep->storage_key, 'keep-image');
        Storage::disk('public')->put($remove->storage_key, 'remove-image');

        $response = $this
            ->withHeader('Accept', 'application/json')
            ->put('/property/image/item/'.$property->id, [
                'existingImages' => [
                    [
                        'imageId' => $keep->id,
                        'position' => 1,
                        'isPrimary' => false,
                    ],
                ],
                'newImages' => [
                    $this->fakePngUpload('forest-new.png'),
                ],
                'newImagesMeta' => [
                    [
                        'position' => 0,
                        'isPrimary' => true,
                    ],
                ],
                'removedImages' => [$remove->id],
            ]);

        $response
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.position', 0)
            ->assertJsonPath('0.isPrimary', true)
            ->assertJsonPath('1.imageId', (string) $keep->id)
            ->assertJsonPath('1.position', 1);

        $this->assertDatabaseHas('property_images', [
            'id' => $keep->id,
            'position' => 1,
            'is_primary' => false,
            'storage_key' => $keep->storage_key,
        ]);

        $this->assertDatabaseMissing('property_images', [
            'id' => $remove->id,
        ]);

        Storage::disk('public')->assertExists($keep->storage_key);
        Storage::disk('public')->assertMissing($remove->storage_key);

        $createdImage = PropertyImage::query()
            ->where('property_id', $property->id)
            ->whereKeyNot($keep->id)
            ->latest('id')
            ->firstOrFail();

        $createdStorageKeys = $this->decodeStorageKeys((string) $createdImage->storage_key);
        Storage::disk('public')->assertExists($createdStorageKeys['thumb']);
        Storage::disk('public')->assertExists($createdStorageKeys['medium']);
        Storage::disk('public')->assertExists($createdStorageKeys['large']);

        $this->assertDatabaseCount('property_images', 2);
    }

    public function test_it_persists_reordered_existing_images_and_returns_them_in_the_same_order(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $first = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 0,
            'is_primary' => true,
            'original_url' => '/storage/a.jpg',
            'thumb_url' => '/storage/a.jpg',
            'medium_url' => '/storage/a.jpg',
            'large_url' => '/storage/a.jpg',
            'storage_key' => 'properties/'.$property->id.'/a.jpg',
        ]);

        $second = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 1,
            'is_primary' => false,
            'original_url' => '/storage/b.jpg',
            'thumb_url' => '/storage/b.jpg',
            'medium_url' => '/storage/b.jpg',
            'large_url' => '/storage/b.jpg',
            'storage_key' => 'properties/'.$property->id.'/b.jpg',
        ]);

        PropertyImageAttribute::query()->create([
            'image_id' => $first->id,
            'caption' => 'First image',
            'alt' => 'First alt',
            'brightness' => 1,
            'gamma' => 1,
            'contrast' => 1,
            'saturation' => 1,
        ]);

        PropertyImageAttribute::query()->create([
            'image_id' => $second->id,
            'caption' => 'Second image',
            'alt' => 'Second alt',
            'brightness' => 1,
            'gamma' => 1,
            'contrast' => 1,
            'saturation' => 1,
        ]);

        $this
            ->withHeader('Accept', 'application/json')
            ->put('/property/image/item/'.$property->id, [
                'existingImages' => [
                    [
                        'imageId' => $first->id,
                        'position' => 1,
                        'isPrimary' => false,
                    ],
                    [
                        'imageId' => $second->id,
                        'position' => 0,
                        'isPrimary' => true,
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.imageId', (string) $second->id)
            ->assertJsonPath('0.position', 0)
            ->assertJsonPath('0.isPrimary', true)
            ->assertJsonPath('1.imageId', (string) $first->id)
            ->assertJsonPath('1.position', 1)
            ->assertJsonPath('1.isPrimary', false);

        $this->assertDatabaseHas('property_images', [
            'id' => $first->id,
            'position' => 1,
            'is_primary' => false,
        ]);

        $this->assertDatabaseHas('property_images', [
            'id' => $second->id,
            'position' => 0,
            'is_primary' => true,
        ]);

        $this->getJson('/property/'.$property->id)
            ->assertOk()
            ->assertJsonPath('property.images.0.imageID', (string) $second->id)
            ->assertJsonPath('property.images.0.position', 0)
            ->assertJsonPath('property.images.0.isPrimary', true)
            ->assertJsonPath('property.images.1.imageID', (string) $first->id)
            ->assertJsonPath('property.images.1.position', 1)
            ->assertJsonPath('property.images.1.isPrimary', false);
    }

    public function test_it_validates_image_replacement_input(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $response = $this->putJson('/property/image/item/'.$property->id, [
            'existingImages' => [
                [
                    'imageId' => 999999,
                    'position' => -1,
                    'isPrimary' => 'maybe',
                ],
            ],
            'removedImages' => [999999],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'existingImages.0.imageId',
                'existingImages.0.position',
                'existingImages.0.isPrimary',
                'removedImages.0',
            ]);
    }

    public function test_it_deletes_a_property_image(): void
    {
        Storage::fake('public');

        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $image = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 0,
            'is_primary' => true,
            'original_url' => '/storage/a.jpg',
            'thumb_url' => '/storage/a.jpg',
            'medium_url' => '/storage/a.jpg',
            'large_url' => '/storage/a.jpg',
            'storage_key' => 'properties/'.$property->id.'/a.jpg',
        ]);

        Storage::disk('public')->put($image->storage_key, 'fake-image');

        $response = $this->deleteJson('/property/image/delete/'.$image->id);

        $response->assertOk();

        $this->assertSame('true', $response->getContent());

        $this->assertDatabaseMissing('property_images', [
            'id' => $image->id,
        ]);

        Storage::disk('public')->assertMissing($image->storage_key);
    }

    public function test_it_fetches_images_for_a_property(): void
    {
        $property = Property::query()->create([
            'title' => 'Forest lot',
        ]);

        $image = PropertyImage::query()->create([
            'property_id' => $property->id,
            'position' => 0,
            'is_primary' => true,
            'original_url' => '/storage/a.jpg',
            'thumb_url' => '/storage/thumb.webp',
            'medium_url' => '/storage/medium.webp',
            'large_url' => '/storage/large.webp',
        ]);

        $response = $this->getJson('/images/item/'.$property->id);

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.imageId', (string) $image->id)
            ->assertJsonPath('0.isPrimary', true)
            ->assertJsonPath('0.thumb_url', '/storage/thumb.webp')
            ->assertJsonPath('0.medium_url', '/storage/medium.webp')
            ->assertJsonPath('0.large_url', '/storage/large.webp');
    }
}
