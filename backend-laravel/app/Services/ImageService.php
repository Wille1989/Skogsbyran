<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Property;
use App\Models\Image;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class ImageService
{
    public function __construct(
        private readonly SupabaseStorageService $storageService
    ) {
    }

    public function store(Property $property, array $validated): Collection {
        return DB::transaction(
            function () use ($property, $validated): Collection {
                foreach ($validated['images'] as $imageData) {
                    $file = $imageData['file'];

                    if (!$file instanceof UploadedFile) {
                        throw new RuntimeException(
                            'Invalid image file.'
                        );
                    }

                    $urls = $this->storageService
                        ->uploadPropertyImage(
                            $file,
                            (int) $property->id
                        );

                    $details = $imageData['details'];
                    $adjustments = $imageData['adjustments'];

                    $image = Image::query()->create([
                        'property_id' => $property->id,

                        'position' => (int) $imageData['position'],
                        'is_primary' => (bool) $imageData['isPrimary'],

                        'original_url' => $urls['original_url'],
                        'thumb_url' => $urls['thumb_url'],
                        'medium_url' => $urls['medium_url'],
                        'large_url' => $urls['large_url'],
                        'storage_key' => $urls['storage_key'] ?? null,
                    ]);

                    $image->metadata()->create([
                        'caption' => $details['caption'],
                        'alt' => $details['altText'],
                        'brightness' => (float) $adjustments['brightness'],
                        'saturation' => (float) $adjustments['saturation'],
                        'contrast' => (float) $adjustments['contrast'],
                        'gamma' => (float) $adjustments['gamma'],
                    ]);
                }

                $this->ensureSinglePrimaryImage($property);

                return $property
                    ->images()
                    ->get();
            }
        );
    }

    public function update(Property $property, array $validated): Collection {
        return DB::transaction(
            function () use ($property, $validated): Collection {
                $patches = $validated['images'];

                $imageIds = array_map(
                    static fn (array $patch): int =>
                        (int) $patch['imageId'],
                    $patches
                );

                $images = Image::query()
                    ->where('property_id', $property->id)
                    ->whereIn('id', $imageIds)
                    ->get()
                    ->keyBy('id');

                foreach ($patches as $patch) {
                    $imageId = (int) $patch['imageId'];
                    $image = $images->get($imageId);

                    if (!$image instanceof Image) {
                        throw (new ModelNotFoundException())->setModel(Image::class, [$imageId]);
                    }

                    $imageUpdates = [];
                    $metadataUpdates = [];

                    if (array_key_exists('position', $patch)) {
                        $imageUpdates['position'] =
                            (int) $patch['position'];
                    }

                    if (array_key_exists('isPrimary', $patch)) {
                        $imageUpdates['is_primary'] =
                            (bool) $patch['isPrimary'];
                    }

                    if (isset($patch['details'])) {
                        $details = $patch['details'];

                        if (array_key_exists('caption', $details)) {
                            $metadataUpdates['caption'] =
                                $details['caption'];
                        }

                        if (array_key_exists('altText', $details)) {
                            $metadataUpdates['alt'] =
                                $details['altText'];
                        }
                    }

                    if (isset($patch['adjustments'])) {
                        $adjustments = $patch['adjustments'];

                        if (
                            array_key_exists(
                                'brightness',
                                $adjustments
                            )
                        ) {
                            $metadataUpdates['brightness'] =
                                (float) $adjustments['brightness'];
                        }

                        if (
                            array_key_exists(
                                'saturation',
                                $adjustments
                            )
                        ) {
                            $metadataUpdates['saturation'] =
                                (float) $adjustments['saturation'];
                        }

                        if (
                            array_key_exists(
                                'contrast',
                                $adjustments
                            )
                        ) {
                            $metadataUpdates['contrast'] =
                                (float) $adjustments['contrast'];
                        }

                        if (
                            array_key_exists('gamma', $adjustments)
                        ) {
                            $metadataUpdates['gamma'] =
                                (float) $adjustments['gamma'];
                        }
                    }

                    if ($imageUpdates !== []) {
                        $image->fill($imageUpdates);

                        if ($image->isDirty()) {
                            $image->save();
                        }
                    }

                    if ($metadataUpdates !== []) {
                        $image->metadata()->updateOrCreate(
                            ['image_id' => $image->id],
                            $metadataUpdates
                        );
                    }
                }

                $this->ensureSinglePrimaryImage($property);

                return $property->images()->get();
            }
        );
    }

    public function delete(Property $property, array $validated): void {
        DB::transaction(
            function () use ($property, $validated): void {
                $images = Image::query()
                    ->where('property_id', $property->id)
                    ->whereIn('id', $validated['imageIds'])
                    ->get();

                foreach ($images as $image) {
                    if (
                        is_string($image->storage_key)
                        && $image->storage_key !== ''
                    ) {
                        $this->storageService
                            ->deletePropertyImage(
                                $image->storage_key
                            );
                    }

                    $image->delete();
                }

                $this->ensureSinglePrimaryImage($property);
            }
        );
    }

    private function ensureSinglePrimaryImage(Property $property): void {
        $images = Image::query()
            ->where('property_id', $property->id)
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        if ($images->isEmpty()) {
            return;
        }

        $primary = $images->firstWhere(
            'is_primary',
            true
        );

        if (!$primary instanceof Image) {
            $primary = $images->first();

            if (!$primary instanceof Image) {
                return;
            }

            $primary->forceFill([
                'is_primary' => true,
            ])->save();
        }

        Image::query()
            ->where('property_id', $property->id)
            ->whereKeyNot($primary->id)
            ->where('is_primary', true)
            ->update([
                'is_primary' => false,
            ]);
    }
}
