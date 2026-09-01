<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Verify the full create-property pipeline with details, images and metadata.
 */
class CreatePropertyPipelineTest extends TestCase
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

    /**
     * Ensure the full create pipeline stores 10 images with mixed metadata states.
     */
    public function test_it_creates_a_property_with_ten_images_and_partial_metadata(): void
    {
        Storage::fake('public');

        $payload = [
            'details' => [
                'title' => 'Skogsgård med sjöläge',
                'caption' => 'Komplett pipeline-test',
                'price' => 4500000,
                'size' => 87.4,
            ],
            'images' => [],
            'position' => [],
            'isPrimary' => [],
        ];

        for ($index = 0; $index < 10; $index++) {
            $payload['images'][] = $this->fakePngUpload("forest-{$index}.png");
            $payload['position'][] = $index;
            $payload['isPrimary'][] = $index === 0 ? '1' : '0';
        }

        for ($index = 0; $index < 5; $index++) {
            $payload['imgAttr'][$index] = [
                'caption' => "Bild {$index}",
                'alt' => "Alt {$index}",
                'brightness' => 1.1 + ($index * 0.5),
                'gamma' => 1.0,
                'contrast' => 1.2,
                'saturation' => 1.3,
            ];
        }

        $response = $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('property.title', 'Skogsgård med sjöläge')
            ->assertJsonCount(10, 'property.images')
            ->assertJsonPath('property.images.0.imageAttributes.caption', 'Bild 0')
            ->assertJsonPath('property.images.4.imageAttributes.alt', 'Alt 4')
            ->assertJsonPath('property.images.5.imageAttributes.caption', '')
            ->assertJsonPath('property.images.5.imageAttributes.brightness', 1)
            ->assertJsonPath('property.images.0.isPrimary', true);

        $this->assertDatabaseCount('properties', 1);
        $this->assertDatabaseCount('property_images', 10);
        $this->assertDatabaseCount('property_image_attributes', 10);
        $this->assertDatabaseHas('property_image_attributes', [
            'caption' => 'Bild 0',
            'alt' => 'Alt 0',
        ]);
        $this->assertDatabaseHas('property_image_attributes', [
            'caption' => '',
            'alt' => '',
            'brightness' => 1.0,
            'gamma' => 1.0,
            'contrast' => 1.0,
            'saturation' => 1.0,
        ]);

        $image = \App\Models\PropertyImage::query()->firstOrFail();
        $storageKeys = $this->decodeStorageKeys((string) $image->storage_key);

        $this->assertArrayHasKey('thumb', $storageKeys);
        $this->assertArrayHasKey('medium', $storageKeys);
        $this->assertArrayHasKey('large', $storageKeys);

        Storage::disk('public')->assertExists($storageKeys['thumb']);
        Storage::disk('public')->assertExists($storageKeys['medium']);
        Storage::disk('public')->assertExists($storageKeys['large']);

        $this->assertStringEndsWith('.webp', $image->thumb_url ?? '');
        $this->assertStringEndsWith('.webp', $image->medium_url ?? '');
        $this->assertStringEndsWith('.webp', $image->large_url ?? '');
    }

    /**
     * Ensure the create pipeline can store a map area together with the property.
     */
    public function test_it_creates_a_property_with_boundaries_in_the_same_request(): void
    {
        Storage::fake('public');

        $response = $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', [
                'details' => [
                    'title' => 'Fastighet med karta',
                    'caption' => 'Skapas med polygon',
                    'price' => 1800000,
                    'size' => 42,
                ],
                'boundaries' => [
                    'name' => 'Område 1',
                    'polygon' => [
                        ['lat' => 59.3293, 'lng' => 18.0686],
                        ['lat' => 59.3301, 'lng' => 18.071],
                        ['lat' => 59.3279, 'lng' => 18.0725],
                    ],
                    'marker' => [
                        'lat' => 59.3295,
                        'lng' => 18.0701,
                    ],
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('property.title', 'Fastighet med karta');

        $this->assertDatabaseCount('properties', 1);
        $this->assertDatabaseCount('property_areas', 1);
        $this->assertDatabaseHas('property_areas', [
            'property_id' => 1,
            'name' => 'Område 1',
            'marker_lat' => 59.3295,
            'marker_lng' => 18.0701,
        ]);
    }

    /**
     * Ensure invalid metadata prevents the entire create pipeline from being stored.
     */
    public function test_it_rejects_the_create_pipeline_when_image_metadata_is_invalid(): void
    {
        Storage::fake('public');

        $response = $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/store', [
            'details' => [
                'title' => 'Ogiltig pipeline',
                'caption' => 'Ska inte sparas',
            ],
            'images' => [
                $this->fakePngUpload('invalid.png'),
            ],
            'position' => [0],
            'isPrimary' => ['1'],
            'imgAttr' => [
                [
                    'caption' => 'Felaktig metadata',
                    'alt' => 'Alt text',
                    'brightness' => 6,
                    'gamma' => 1,
                    'contrast' => 1,
                    'saturation' => 1,
                ],
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['images_meta.0.attributes.brightness']);

        $this->assertDatabaseCount('properties', 0);
        $this->assertDatabaseCount('property_images', 0);
        $this->assertDatabaseCount('property_image_attributes', 0);
    }
}
