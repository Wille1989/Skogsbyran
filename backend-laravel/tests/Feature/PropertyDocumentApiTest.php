<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Verify typed PDF uploads for properties.
 */
class PropertyDocumentApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Build a valid fake PDF upload.
     */
    private function fakePdfUpload(string $name): UploadedFile
    {
        return UploadedFile::fake()->create($name, 256, 'application/pdf');
    }

    public function test_it_stores_and_replaces_a_property_document(): void
    {
        Storage::fake('public');

        $property = Property::query()->create([
            'title' => 'Dokumentfastighet',
        ]);

        $firstResponse = $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/document/'.$property->id.'/prospect', [
                'document' => $this->fakePdfUpload('prospekt-v1.pdf'),
            ]);

        $firstResponse
            ->assertCreated()
            ->assertJsonPath('property.documents.prospect.type', 'prospect')
            ->assertJsonPath('property.documents.prospect.originalName', 'prospekt-v1.pdf')
            ->assertJsonPath('property.documents.bid_form', null)
            ->assertJsonPath('property.documents.property_map', null);

        $firstStorageKey = (string) \App\Models\PropertyDocument::query()
            ->where('property_id', $property->id)
            ->where('type', 'prospect')
            ->value('storage_key');

        Storage::disk('public')->assertExists($firstStorageKey);

        $secondResponse = $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/document/'.$property->id.'/prospect', [
                'document' => $this->fakePdfUpload('prospekt-v2.pdf'),
            ]);

        $secondResponse
            ->assertCreated()
            ->assertJsonPath('property.documents.prospect.originalName', 'prospekt-v2.pdf');

        $secondStorageKey = (string) \App\Models\PropertyDocument::query()
            ->where('property_id', $property->id)
            ->where('type', 'prospect')
            ->value('storage_key');

        Storage::disk('public')->assertMissing($firstStorageKey);
        Storage::disk('public')->assertExists($secondStorageKey);

        $this->assertDatabaseCount('property_documents', 1);
    }

    public function test_it_deletes_a_property_document(): void
    {
        Storage::fake('public');

        $property = Property::query()->create([
            'title' => 'Dokumentfastighet',
        ]);

        $this
            ->withHeader('Accept', 'application/json')
            ->post('/property/document/'.$property->id.'/bid_form', [
                'document' => $this->fakePdfUpload('anbud.pdf'),
            ]);

        $storageKey = (string) \App\Models\PropertyDocument::query()
            ->where('property_id', $property->id)
            ->where('type', 'bid_form')
            ->value('storage_key');

        Storage::disk('public')->assertExists($storageKey);

        $this->deleteJson('/property/document/'.$property->id.'/bid_form')
            ->assertOk()
            ->assertJsonPath('property.documents.bid_form', null);

        Storage::disk('public')->assertMissing($storageKey);
        $this->assertDatabaseMissing('property_documents', [
            'property_id' => $property->id,
            'type' => 'bid_form',
        ]);
    }

    public function test_it_validates_document_upload_input(): void
    {
        $property = Property::query()->create([
            'title' => 'Dokumentfastighet',
        ]);

        $response = $this->postJson('/property/document/'.$property->id.'/invalid_type', []);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'document']);
    }
}
