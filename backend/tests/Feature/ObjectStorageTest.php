<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Infrastructure\Storage\ObjectStorage;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class ObjectStorageTest extends TestCase
{
    public function test_it_stores_reads_temporary_urls_and_deletes_objects_through_named_disks(): void
    {
        $storage = $this->app->make(ObjectStorage::class);

        foreach ([ObjectStorage::IMAGES_DISK, ObjectStorage::DOCUMENTS_DISK] as $disk) {
            Storage::fake($disk);
            Storage::disk($disk)->buildTemporaryUrlsUsing(
                fn (string $path): string => 'https://temporary.test/'.$path
            );

            $storageKey = $disk === ObjectStorage::IMAGES_DISK
                ? 'properties/1/images/47/large.webp'
                : 'documents/18/original.pdf';

            $storage->putContents($disk, $storageKey, 'private-object');

            Storage::disk($disk)->assertExists($storageKey);
            $this->assertTrue($storage->exists($disk, $storageKey));
            $this->assertSame('private-object', $storage->get($disk, $storageKey));
            $this->assertSame(
                'https://temporary.test/'.$storageKey,
                $storage->temporaryUrl($disk, $storageKey, now()->addMinutes(5))
            );

            $storage->delete($disk, $storageKey);

            Storage::disk($disk)->assertMissing($storageKey);
        }
    }
}
