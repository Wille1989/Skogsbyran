<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Middleware\EnsureAdminJwt;
use App\Modules\Document\Models\Document;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class DocumentModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_uploads_and_replaces_documents_through_normalized_tables(): void
    {
        Storage::fake('public');
        $this->withoutMiddleware(EnsureAdminJwt::class);

        $property = Property::query()->create([
            'title' => 'Document module property',
            'caption' => 'Normalized document storage',
        ]);

        $firstResponse = $this->post('/property/'.$property->id.'/documents', [
            'type' => Document::TYPE_PROSPECT,
            'document' => UploadedFile::fake()->create(
                'prospekt-v1.pdf',
                256,
                'application/pdf'
            ),
        ]);

        $firstResponse
            ->assertCreated()
            ->assertJsonPath('propertyId', (string) $property->id)
            ->assertJsonPath('type', Document::TYPE_PROSPECT)
            ->assertJsonPath('title', 'Prospekt')
            ->assertJsonPath('originalName', 'prospekt-v1.pdf')
            ->assertJsonPath('mimeType', 'application/pdf');

        $firstDocumentId = (int) $firstResponse->json('documentId');
        $firstStorageKey = (string) DB::table('document_variants')
            ->where('document_id', $firstDocumentId)
            ->where('variant', 'original')
            ->value('storage_key');

        Storage::disk('public')->assertExists($firstStorageKey);

        $this->assertDatabaseHas('property_documents', [
            'property_id' => $property->id,
            'document_id' => $firstDocumentId,
            'type' => Document::TYPE_PROSPECT,
            'sort_order' => 10,
        ]);

        $secondResponse = $this->post('/property/'.$property->id.'/documents', [
            'type' => Document::TYPE_PROSPECT,
            'document' => UploadedFile::fake()->create(
                'prospekt-v2.pdf',
                300,
                'application/pdf'
            ),
        ]);

        $secondResponse
            ->assertCreated()
            ->assertJsonPath('type', Document::TYPE_PROSPECT)
            ->assertJsonPath('originalName', 'prospekt-v2.pdf');

        $secondDocumentId = (int) $secondResponse->json('documentId');
        $secondStorageKey = (string) DB::table('document_variants')
            ->where('document_id', $secondDocumentId)
            ->where('variant', 'original')
            ->value('storage_key');

        $this->assertNotSame($firstDocumentId, $secondDocumentId);
        $this->assertDatabaseMissing('documents', ['id' => $firstDocumentId]);
        $this->assertDatabaseCount('documents', 1);
        $this->assertDatabaseCount('property_documents', 1);
        $this->assertDatabaseCount('document_variants', 1);

        Storage::disk('public')->assertMissing($firstStorageKey);
        Storage::disk('public')->assertExists($secondStorageKey);

        $this->assertFalse(Schema::hasTable('legacy_property_documents'));
    }
}
