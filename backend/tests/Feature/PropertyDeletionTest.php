<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Activity\Enums\EventType;
use App\Modules\Activity\Models\ActivityEvent;
use App\Modules\Document\Models\Document;
use App\Modules\Property\Models\Property;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

final class PropertyDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_delete_removes_owned_data_and_files_but_preserves_shared_documents(): void
    {
        $this->actingAs(User::factory()->create(['admin' => true]));
        $property = $this->propertyWithData();
        $other = Property::query()->create(['title' => 'Other property']);
        $shared = $property->documents()->firstOrFail();
        $other->documents()->attach($shared->id);
        DB::table('analytics_events')->insert(['event_type' => 'visitor', 'created_at' => now()]);

        $this->deleteJson('/property/'.$property->id)->assertNoContent();
        $this->assertDatabaseMissing('properties', ['id' => $property->id]);
        foreach (['images', 'image_metadata', 'image_adjustments', 'image_variants', 'locations', 'location_areas', 'area_points', 'location_pois'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseCount('analytics_events', 1);
        $this->assertDatabaseCount('activity_events', 1);
        $this->assertDatabaseHas('activity_events', ['event_type' => 'property_deleted', 'property_id' => null]);
        $this->assertDatabaseCount('documents', 1);
        $this->assertDatabaseCount('document_variants', 1);
        $this->assertDatabaseCount('property_documents', 1);
        $this->assertSame([], Storage::disk('images')->allFiles());
        $this->assertSame(['document-0.pdf'], Storage::disk('documents')->allFiles());
        $this->getJson('/property/'.$property->id)->assertNotFound();
        $this->deleteJson('/property/'.$property->id)->assertNotFound();
        $this->getJson('/activity')->assertOk()->assertJsonPath('data.0.eventType', 'property_deleted')->assertJsonPath('data.0.property', null);
        $this->assertDatabaseCount('activity_events', 1);
    }

    public function test_storage_failure_rolls_back_database_and_does_not_record_deletion(): void
    {
        $this->actingAs(User::factory()->create(['admin' => true]));
        $property = $this->propertyWithData();
        $documentsDisk = Storage::disk('documents');
        $failure = Mockery::mock(FilesystemAdapter::class);
        $failure->shouldReceive('delete')->once()->andReturn(false);
        Storage::set('documents', $failure);

        $this->deleteJson('/property/'.$property->id)->assertStatus(500);
        $this->assertDatabaseHas('properties', ['id' => $property->id]);
        $this->assertDatabaseCount('images', 2);
        $this->assertDatabaseCount('documents', 2);
        $this->assertDatabaseCount('property_documents', 2);
        $this->assertDatabaseCount('analytics_events', 2);
        $this->assertDatabaseCount('activity_events', 1);
        $this->assertDatabaseMissing('activity_events', ['event_type' => 'property_deleted']);

        // Retained storage keys allow retry even when earlier files were already removed.
        Storage::set('documents', $documentsDisk);
        $this->deleteJson('/property/'.$property->id)->assertNoContent();
        $this->assertDatabaseCount('documents', 0);
        $this->assertDatabaseCount('document_variants', 0);
        $this->assertSame([], Storage::disk('documents')->allFiles());
        $this->assertDatabaseCount('activity_events', 1);
        $this->assertDatabaseHas('activity_events', ['event_type' => 'property_deleted']);
    }

    public function test_only_admin_can_delete(): void
    {
        $property = $this->propertyWithData();
        $this->deleteJson('/property/'.$property->id)->assertUnauthorized();
        $this->actingAs(User::factory()->create(['admin' => false]));
        $this->deleteJson('/property/'.$property->id)->assertForbidden();
        $this->assertDatabaseHas('properties', ['id' => $property->id]);
        Storage::disk('images')->assertExists('image-0.webp');
        $this->assertDatabaseMissing('activity_events', ['event_type' => 'property_deleted']);
    }

    private function propertyWithData(): Property
    {
        Storage::fake('images');
        Storage::fake('documents');
        $property = Property::query()->create(['title' => 'Delete verification', 'is_visible' => false, 'publish_at' => now()->addDay(), 'scheduled_listing_status' => 'sold', 'scheduled_status_at' => now()->addDays(2)]);
        foreach ([0, 1] as $index) {
            $image = $property->images()->create(['sort_order' => $index, 'is_primary' => $index === 0]);
            $image->metadata()->create(['caption' => 'Caption', 'alt_text' => 'Alt']);
            $image->adjustment()->create([]);
            $image->variants()->create(['variant' => 'large', 'storage_key' => 'image-'.$index.'.webp', 'mime_type' => 'image/webp']);
            Storage::disk('images')->put('image-'.$index.'.webp', 'test image');
            $document = Document::query()->create(['name' => 'Document', 'original_filename' => 'document.pdf', 'mime_type' => 'application/pdf']);
            $document->variants()->create(['variant' => 'original', 'storage_key' => 'document-'.$index.'.pdf', 'mime_type' => 'application/pdf']);
            $property->documents()->attach($document->id);
            Storage::disk('documents')->put('document-'.$index.'.pdf', 'test document');
            DB::table('analytics_events')->insert(['event_type' => 'image_click', 'property_id' => $index === 0 ? $property->id : null, 'image_id' => $image->id, 'created_at' => now()]);
        }
        $location = $property->location()->create(['latitude' => 59, 'longitude' => 18]);
        $location->pois()->create(['name' => 'POI', 'latitude' => 59, 'longitude' => 18]);
        $area = $location->areas()->create(['name' => 'Area']);
        foreach ([[59, 18], [59.1, 18], [59, 18.1]] as $index => [$lat, $lng]) {
            $area->points()->create(['latitude' => $lat, 'longitude' => $lng, 'sort_order' => $index]);
        }
        ActivityEvent::query()->create(['event_type' => EventType::PropertyCreated, 'property_id' => $property->id, 'occurred_at' => now()]);
        return $property;
    }
}
