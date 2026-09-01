<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Storage\ObjectStorage;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class ObjectStorageTest extends TestCase
{
    public function test_it_stores_reads_urls_and_deletes_objects_through_configured_disk(): void
    {
        config()->set('filesystems.object_storage_disk', 'public');

        Storage::fake('public');

        $storage = $this->app->make(ObjectStorage::class);

        $storage->putContents('properties/1/documents/original.pdf', 'fake-pdf');

        Storage::disk('public')->assertExists('properties/1/documents/original.pdf');

        $this->assertSame(
            '/storage/properties/1/documents/original.pdf',
            $storage->url('properties/1/documents/original.pdf')
        );

        $storage->delete('properties/1/documents/original.pdf');

        Storage::disk('public')->assertMissing('properties/1/documents/original.pdf');
    }
}
