<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Storage\ObjectStorage;
use App\Models\User;
use App\Modules\Document\Models\Document;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class DocumentModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_uploads_multiple_named_documents_without_legacy_type(): void
    {
        Storage::fake(ObjectStorage::DOCUMENTS_DISK);
        Storage::disk(ObjectStorage::DOCUMENTS_DISK)->buildTemporaryUrlsUsing(
            fn (string $path): string => 'https://temporary-documents.test/'.$path
        );
        Sanctum::actingAs(User::factory()->create(['admin' => true]), ['admin']);

        $property = Property::query()->create([
            'title' => 'Named document property',
            'caption' => 'Multiple PDFs',
        ]);

        $firstResponse = $this->post('/property/'.$property->id.'/documents', [
            'title' => 'Skogsbruksplan',
            'document' => UploadedFile::fake()->create(
                'skogsbruksplan.pdf',
                256,
                'application/pdf'
            ),
        ]);

        $secondResponse = $this->post('/property/'.$property->id.'/documents', [
            'title' => 'Servitut',
            'document' => UploadedFile::fake()->create(
                'servitut.pdf',
                128,
                'application/pdf'
            ),
        ]);

        $firstResponse
            ->assertCreated()
            ->assertJsonPath('type', 'document')
            ->assertJsonPath('title', 'Skogsbruksplan');

        $secondResponse
            ->assertCreated()
            ->assertJsonPath('type', 'document')
            ->assertJsonPath('title', 'Servitut');

        $this->assertDatabaseCount('documents', 2);
        $this->assertDatabaseCount('property_documents', 2);
        $this->assertDatabaseHas('property_documents', [
            'property_id' => $property->id,
            'type' => null,
            'title' => 'Skogsbruksplan',
        ]);
        $this->assertDatabaseHas('property_documents', [
            'property_id' => $property->id,
            'type' => null,
            'title' => 'Servitut',
        ]);
    }

    public function test_it_uploads_and_replaces_documents_through_normalized_tables(): void
    {
        Storage::fake(ObjectStorage::DOCUMENTS_DISK);
        Storage::disk(ObjectStorage::DOCUMENTS_DISK)->buildTemporaryUrlsUsing(
            fn (string $path): string => 'https://temporary-documents.test/'.$path
        );
        Sanctum::actingAs(User::factory()->create(['admin' => true]), ['admin']);

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

        Storage::disk(ObjectStorage::DOCUMENTS_DISK)->assertExists($firstStorageKey);

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

        Storage::disk(ObjectStorage::DOCUMENTS_DISK)->assertMissing($firstStorageKey);
        Storage::disk(ObjectStorage::DOCUMENTS_DISK)->assertExists($secondStorageKey);
    }
}
