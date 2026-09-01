<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Property\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyApiTest extends TestCase
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

    private function fakePngUpload(string $name): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1600, 900);
    }

    public function test_it_creates_a_property_without_images(): void
    {
        $response = $this->postJson('/property/store', [
            'details.title' => 'Skogsfastighet',
            'details.caption' => 'Test caption',
            'details.price' => 1250000,
            'details.size' => 12.5,
            'boundaries.polygon' => [
                ['lat' => 59.0, 'lng' => 18.0],
                ['lat' => 59.1, 'lng' => 18.1],
                ['lat' => 59.0, 'lng' => 18.2],
            ],
            'boundaries.marker.lat' => 59.0,
            'boundaries.marker.lng' => 18.0,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('property.title', 'Skogsfastighet')
            ->assertJsonPath('property.documents.bid_form', null)
            ->assertJsonPath('property.documents.prospect', null)
            ->assertJsonPath('property.documents.property_map', null)
            ->assertJsonPath('property.boundaries.polygon', json_encode([
                ['lat' => 59.0, 'lng' => 18.0],
                ['lat' => 59.1, 'lng' => 18.1],
                ['lat' => 59.0, 'lng' => 18.2],
            ], JSON_THROW_ON_ERROR))
            ->assertJsonPath('property.boundaries.marker.lat', 59)
            ->assertJsonPath('property.boundaries.marker.lng', 18);

        $this->assertDatabaseHas('properties', [
            'title' => 'Skogsfastighet',
        ]);
    }

    public function test_it_validates_that_title_is_required(): void
    {
        $response = $this->postJson('/property/store', [
            'details.caption' => 'Missing title',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['details.title']);
    }

    public function test_it_lists_and_deletes_properties(): void
    {
        $createResponse = $this->postJson('/property/store', [
            'details.title' => 'Gallringsskog',
        ]);

        $propertyId = $createResponse->json('property.propertyID');

        $this->getJson('/properties')
            ->assertOk()
            ->assertJsonCount(1, 'properties');

        $this->deleteJson('/property/delete/'.$propertyId)
            ->assertNoContent();

        $this->assertDatabaseMissing('properties', [
            'id' => $propertyId,
        ]);
    }

    public function test_it_fetches_a_specific_property_with_images_and_metadata(): void
    {
        Storage::fake('public');

        $createResponse = $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', [
                'details' => [
                    'title' => 'Visningsfastighet',
                    'caption' => 'För detaljvy',
                    'price' => 2200000,
                    'size' => 33.5,
                ],
                'images' => [
                    $this->fakePngUpload('detail-1.png'),
                    $this->fakePngUpload('detail-2.png'),
                ],
                'position' => [0, 1],
                'isPrimary' => ['1', '0'],
                'imgAttr' => [
                    [
                        'caption' => 'Första bilden',
                        'alt' => 'Skogsbryn',
                        'brightness' => 1.2,
                        'gamma' => 1,
                        'contrast' => 1.1,
                        'saturation' => 1.3,
                    ],
                ],
            ]);

        $propertyId = $createResponse->json('property.propertyID');
        $image = PropertyImage::query()->where('property_id', $propertyId)->firstOrFail();

        $this->getJson('/property/'.$propertyId)
            ->assertOk()
            ->assertJsonPath('property.propertyID', $propertyId)
            ->assertJsonPath('property.images.0.isPrimary', true)
            ->assertJsonPath('property.images.0.thumbUrl', $image->thumb_url)
            ->assertJsonPath('property.images.0.mediumUrl', $image->medium_url)
            ->assertJsonPath('property.images.0.largeUrl', $image->large_url)
            ->assertJsonPath('property.images.0.imageAttributes.caption', 'Första bilden')
            ->assertJsonPath('property.images.1.imageAttributes.caption', '')
            ->assertJsonPath('property.images.1.imageAttributes.brightness', 1);
    }

    public function test_it_lists_all_properties_with_images_and_metadata(): void
    {
        Storage::fake('public');

        $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', [
                'details' => [
                    'title' => 'Listfastighet A',
                    'caption' => 'För listvy',
                ],
                'images' => [
                    $this->fakePngUpload('list-a.png'),
                ],
                'position' => [0],
                'isPrimary' => ['1'],
                'imgAttr' => [
                    [
                        'caption' => 'Listbild A',
                        'alt' => 'Alt A',
                        'brightness' => 1,
                        'gamma' => 1,
                        'contrast' => 1,
                        'saturation' => 1,
                    ],
                ],
            ]);

        $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', [
                'details' => [
                    'title' => 'Listfastighet B',
                    'caption' => 'Andra kortet',
                ],
            ]);

        $this->getJson('/properties')
            ->assertOk()
            ->assertJsonCount(2, 'properties')
            ->assertJsonPath('properties.1.title', 'Listfastighet A')
            ->assertJsonPath('properties.1.images.0.imageAttributes.caption', 'Listbild A')
            ->assertJsonPath('properties.1.images.0.thumbUrl', PropertyImage::query()->whereHas('property', fn ($query) => $query->where('title', 'Listfastighet A'))->firstOrFail()->thumb_url)
            ->assertJsonCount(1, 'properties.1.images')
            ->assertJsonPath('properties.1.boundaries', null);
    }

    public function test_it_lists_primary_and_two_following_images_for_property_cards(): void
    {
        Storage::fake('public');

        $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', [
                'details' => [
                    'title' => 'Kortgalleri',
                    'caption' => 'Tre synliga bilder pa startsidan',
                ],
                'images' => [
                    $this->fakePngUpload('card-0.png'),
                    $this->fakePngUpload('card-1.png'),
                    $this->fakePngUpload('card-2.png'),
                    $this->fakePngUpload('card-3.png'),
                ],
                'position' => [0, 1, 2, 3],
                'isPrimary' => ['1', '0', '0', '0'],
            ]);

        $this->getJson('/properties')
            ->assertOk()
            ->assertJsonPath('properties.0.title', 'Kortgalleri')
            ->assertJsonCount(3, 'properties.0.images')
            ->assertJsonPath('properties.0.images.0.position', 0)
            ->assertJsonPath('properties.0.images.1.position', 1)
            ->assertJsonPath('properties.0.images.2.position', 2);
    }

    public function test_it_returns_not_found_for_a_missing_property_id(): void
    {
        $this->getJson('/property/999999')
            ->assertNotFound();
    }

    public function test_it_deletes_a_property_with_related_area_images_and_metadata(): void
    {
        Storage::fake('public');

        $createResponse = $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', [
                'details' => [
                    'title' => 'Raderingsfastighet',
                    'caption' => 'Ska försvinna helt',
                ],
                'boundaries' => [
                    'name' => 'OmrÃ¥de 1',
                    'polygon' => [
                        ['lat' => 59.0, 'lng' => 18.0],
                        ['lat' => 59.1, 'lng' => 18.1],
                        ['lat' => 59.0, 'lng' => 18.2],
                    ],
                    'marker' => [
                        'lat' => 59.0,
                        'lng' => 18.0,
                    ],
                ],
                'images' => [
                    $this->fakePngUpload('delete-a.png'),
                    $this->fakePngUpload('delete-b.png'),
                ],
                'position' => [0, 1],
                'isPrimary' => ['1', '0'],
                'imgAttr' => [
                    [
                        'caption' => 'Första bildens metadata',
                        'alt' => 'Alt delete A',
                        'brightness' => 1,
                        'gamma' => 1,
                        'contrast' => 1,
                        'saturation' => 1,
                    ],
                ],
            ]);

        $propertyId = $createResponse->json('property.propertyID');

        $property = Property::query()->with('images')->findOrFail($propertyId);
        foreach ($property->images as $image) {
            if (is_string($image->storage_key) && $image->storage_key !== '') {
                $storageKeys = $this->decodeStorageKeys($image->storage_key);
                Storage::disk('public')->assertExists($storageKeys['thumb']);
                Storage::disk('public')->assertExists($storageKeys['medium']);
                Storage::disk('public')->assertExists($storageKeys['large']);
            }
        }

        $this->deleteJson('/property/delete/'.$propertyId)
            ->assertNoContent();

        $this->assertDatabaseMissing('properties', ['id' => $propertyId]);
        $this->assertDatabaseMissing('property_areas', ['property_id' => $propertyId]);
        $this->assertDatabaseMissing('property_images', ['property_id' => $propertyId]);

        foreach ($property->images as $image) {
            if (is_string($image->storage_key) && $image->storage_key !== '') {
                $storageKeys = $this->decodeStorageKeys($image->storage_key);
                Storage::disk('public')->assertMissing($storageKeys['thumb']);
                Storage::disk('public')->assertMissing($storageKeys['medium']);
                Storage::disk('public')->assertMissing($storageKeys['large']);
            }
        }
    }

    public function test_it_returns_not_found_when_deleting_a_missing_property(): void
    {
        $this->deleteJson('/property/delete/999999')
            ->assertNotFound();
    }
}
