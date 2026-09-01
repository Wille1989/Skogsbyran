<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Middleware\EnsureAdminJwt;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class ImageModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_uploads_images_into_normalized_image_tables(): void
    {
        Storage::fake('public');
        $this->withoutMiddleware(EnsureAdminJwt::class);

        $property = Property::query()->create([
            'title' => 'Image module property',
            'caption' => 'Normalized image storage',
        ]);

        $response = $this->post('/property/'.$property->id.'/images', [
            'images' => [
                [
                    'file' => UploadedFile::fake()->image('forest.png', 1600, 900),
                    'position' => 0,
                    'isPrimary' => '1',
                    'details' => json_encode([
                        'caption' => 'Forest caption',
                        'altText' => 'Forest alt',
                    ], JSON_THROW_ON_ERROR),
                    'adjustments' => json_encode([
                        'brightness' => 1.1,
                        'saturation' => 1.2,
                        'contrast' => 1.3,
                        'gamma' => 1.0,
                    ], JSON_THROW_ON_ERROR),
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonCount(1)
            ->assertJsonPath('0.position', 0)
            ->assertJsonPath('0.isPrimary', true)
            ->assertJsonPath('0.details.caption', 'Forest caption')
            ->assertJsonPath('0.details.altText', 'Forest alt')
            ->assertJsonPath('0.adjustments.brightness', 1.1);

        $imageId = (int) $response->json('0.imageId');

        $this->assertDatabaseHas('images', [
            'id' => $imageId,
            'property_id' => $property->id,
            'sort_order' => 0,
            'is_primary' => true,
        ]);

        $this->assertDatabaseHas('image_metadata', [
            'image_id' => $imageId,
            'caption' => 'Forest caption',
            'alt_text' => 'Forest alt',
        ]);

        $this->assertDatabaseHas('image_adjustments', [
            'image_id' => $imageId,
            'brightness' => 1.1,
            'saturation' => 1.2,
            'contrast' => 1.3,
            'gamma' => 1.0,
        ]);

        $this->assertDatabaseCount('image_variants', 3);

        $storageKeys = DB::table('image_variants')
            ->where('image_id', $imageId)
            ->pluck('storage_key')
            ->all();

        foreach ($storageKeys as $storageKey) {
            Storage::disk('public')->assertExists($storageKey);
        }

        $this->assertFalse(Schema::hasTable('property_images'));
        $this->assertFalse(Schema::hasTable('property_image_attributes'));
    }
}
